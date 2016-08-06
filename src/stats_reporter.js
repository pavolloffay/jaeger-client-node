// @flow
export default class StatsReporter {
    _statsClient: any;

    //todo(oibe) user interface for stats
    constructor(statsClient: any) {
        this._statsClient = statsClient;
    }

    reportSuccess(metricName: string, delta: number): void {
        if (this._statsClient) {
            this._statsClient.increment(metricName, delta, {
                'tags': {
                    'status': 'success'
                }
            });
        }
    }

    reportError(metricName: string, delta: number) {
        if (this._statsClient) {
            this._statsClient.increment(metricName, delta, {
                'tags': {
                    'status': 'error'
                }
            });
        }
    }
}
