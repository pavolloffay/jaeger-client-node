// @flow
// Copyright (c) 2016 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import {assert} from 'chai';
import MockStatsClient from './lib/mock_stats_client';
import StatsReporter from '../src/stats_reporter.js';

describe('stats_reporter should', () => {
    let statsReporter: StatsReporter;
    let  mockStats: MockStatsClient;

    beforeEach(() => {
        mockStats = new MockStatsClient();
        statsReporter = new StatsReporter(mockStats);
    });

    it('report success properly', () => {
        statsReporter.reportSuccess('positive.metric', 1);

        assert.isOk(mockStats._name_to_delta['positive.metric']);
        assert.equal(mockStats._name_to_delta['positive.metric'], 1);
        assert.isOk(mockStats._name_to_tags['positive.metric'] instanceof Object);
    });

    it('report error properly', () => {
        statsReporter.reportError('negative.metric', 1);

        assert.isOk(mockStats._name_to_delta['negative.metric']);
        assert.equal(mockStats._name_to_delta['negative.metric'], 1);
        assert.isOk(mockStats._name_to_tags['negative.metric'] instanceof Object);
    });

});
