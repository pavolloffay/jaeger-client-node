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
import bufferEqual from 'buffer-equal';
import ConstSampler from '../src/samplers/const_sampler.js';
import * as constants from '../src/constants.js';
import InMemoryReporter from '../src/reporters/in_memory_reporter.js';
import SpanContext from '../src/span_context.js';
import Tracer from '../src/tracer.js';
import Utils from '../src/util.js';

describe('tracer should', () => {
    let tracer;
    let reporter = new InMemoryReporter();

    beforeEach(() => {
        tracer = new Tracer(
            'test-service-name',
            reporter,
            new ConstSampler(true)
        );
    });

    it('create a span correctly through _createSpan', () => {
        let traceId = Utils.encodeInt64(1);
        let spanId = Utils.encodeInt64(2);
        let parentId = Utils.encodeInt64(3);
        let flags = 1;
        let host = Utils.createEndpoint('test-service', 'localhost', 8080);
        let isClient = false;

        let context = new SpanContext(traceId, spanId, parentId, flags);
        let span = tracer._createSpan('op-name', context, isClient, host);

        assert.isOk(bufferEqual(span.context().traceId, traceId));
        assert.isOk(bufferEqual(span.context().spanId, spanId));
        assert.isOk(bufferEqual(span.context().parentId, parentId));
        assert.equal(span.context().flags, flags);
    });

    it ('report a span with proper tags', () => {
        let traceId = Utils.encodeInt64(1);
        let spanId = Utils.encodeInt64(2);
        let parentId = Utils.encodeInt64(3);
        let flags = 1;
        let host = Utils.createEndpoint('test-service', 'localhost', 8080);
        let isClient = false;

        let context = new SpanContext(traceId, spanId, parentId, flags);
        let span = tracer._createSpan('op-name', context, isClient, host);

        tracer._report(span);

        assert.isOk(reporter.spans.length, 1);
        assert.equal(span, reporter.spans[0]);
    });

    it ('start a root span with proper structure', () => {
        let span = tracer.startSpan({
            operationName: 'test-name',
            isClient: true
        });

        assert.equal(span.context().traceId, span.context().spanId);
        assert.isNotOk(span.context().parentId);
        assert.equal(span.context().flags, constants.SAMPLED_MASK);
    });

    it ('start a child span with the proper span context structure', () => {

    });
});
