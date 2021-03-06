import { injectable, inject } from 'inversify';
import moment from 'moment';

import { ITimetableScrapeService, IHttpService, IWebParseService, IZtmStation, IZtmPlatform, IRealTimeDepartureService } from '../interface';
import { TYPES } from '../IoC/types';
import { ZtmStation } from '../schema';
import { ZtmPlatform } from '../schema/ztm/ZtmPlatform';

@injectable()
export class ZtmScrapeService implements ITimetableScrapeService {
  constructor(
    @inject(TYPES.IHttpService) private httpService: IHttpService,
    @inject(TYPES.IWebParseService) private webParseService: IWebParseService,
    @inject(TYPES.IRealTimeDepartureService) private sipTwService: IRealTimeDepartureService,
  ) {}

  async scapeTimetable(): Promise<IZtmStation[]> {
    const stationsWithoutPlatforms = await this.getEmptyStations();
    const stationsWithPlatforms = this.getPlatforms(stationsWithoutPlatforms);
    return stationsWithPlatforms;
  }

  public async getEmptyStations(): Promise<IZtmStation[]> {
    const aggregateUrl = this.generateAggregateUrl();
    console.log(`Fetching list of stations from ${aggregateUrl} ...`);
    const fetchedWebsite = await this.httpService.get<string>(aggregateUrl);
    if (!fetchedWebsite) {
      console.log('Could not fetch list of stations from ZTM.');
      return [];
    }
    console.log('List of stations fetched. Parsing...');
    const $ = this.webParseService.parseHTMLString(fetchedWebsite);
    const links = $('.timetable-stops-block-body-item a');
    const warsawIdentifier = '(Warszawa)';
    const emptyStationList: IZtmStation[] = [];
    const warsawLinks = links.filter((index, element) => (
      $(element).text().includes(warsawIdentifier)
    ));
    warsawLinks.each((index, element) => {
      const item = $(element);
      const url = item.attr('href');
      const fullName = item.find('span').first().text();
      const name = fullName.split(warsawIdentifier)[0].trim();
      const ztmId = url.split('wtp_st=')[1];
      const ztmStation = new ZtmStation(ztmId, name, url);
      emptyStationList.push(ztmStation);
    });
    console.log(`List of stations parsed. Number of stations: ${emptyStationList.length}`);
    return emptyStationList;
  }

  public async getPlatforms(emptyStations: IZtmStation[]): Promise<IZtmStation[]> {
    const result: IZtmStation[] = [];
    const sipTwIds = await this.sipTwService.getPlatformsList();
    const len = emptyStations.length;
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < len; i++) {
      const { name, url, ztmId } = emptyStations[i];
      console.log(`Fetching platforms for station '${name}' ...`);
      const fetchedWebsite = await this.httpService.get<string>(url);
      if (!fetchedWebsite) {
        console.log(`Could not get platforms for station ${name}`);
        return [];
      }
      const $ = this.webParseService.parseHTMLString(fetchedWebsite);
      const links = $('.timetable-link');
      const platforms: IZtmPlatform[] = [];
      links.each((index, element) => {
        const item = $(element);
        const platformUrl = item.attr('href');
        const fullName = item.find('.timetable-stop-point-title-name').text().trim().split(' ');
        const plNumber = fullName[fullName.length - 1];
        const sipTwId = ztmId + plNumber;
        const isInSipTw = sipTwIds.includes(sipTwId);
        const direction = item.find('.timetable-stop-point-title-destination').text().trim();
        platforms.push(new ZtmPlatform(plNumber, direction, platformUrl, isInSipTw));
      });
      result.push(new ZtmStation(ztmId, name, url, platforms));
      console.log(`Platforms for stations '${name}' succesfully fetched and parsed.`);
    }
    const success = result.length;
    const failure = emptyStations.length - success;
    if (failure) {
      return [];
    }
    console.log(`Platforms fetching completed. Success: ${success}. Failure: ${failure}`);
    return result;
  }

  private generateAggregateUrl(): string {
    const date = moment().format('YYYY-MM-DD');
    return `https://www.wtp.waw.pl/rozklady-jazdy/?wtp_dt=${date}&wtp_md=1`;
  }
}
