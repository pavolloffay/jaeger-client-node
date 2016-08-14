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
import bufferEqual from 'buffer-equal';
import * as constants from '../src/constants.js';
import ConstSampler from '../src/samplers/const_sampler.js';
import HttpHeaderCodec from '../src/propagators/http_header_codec.js';
import Utils from '../src/util.js';
import SpanContext from '../src/span_context.js';

describe ('codecs should', () => {
    let codec;

    before(() => {
        codec = new HttpHeaderCodec(new ConstSampler(true));
    });

    it('extract headers with baggage', () => {
        let carrier = {};
        carrier[`${constants.TRACER_STATE_HEADER_NAME}`] = '0000000000000100:000000000000007f:0:1';
        carrier[`${constants.TRACER_BAGGAGE_HEADER_PREFIX}keyOne`] = 'leela';
        carrier[`${constants.TRACER_BAGGAGE_HEADER_PREFIX}keyTwo`] = 'fry';
        let spanContext = codec.extract(carrier);

        assert.isOk(bufferEqual(spanContext.traceId, Utils.encodeInt64(0x100)));
        assert.isOk(bufferEqual(spanContext.spanId, Utils.encodeInt64(0x7f)));
        assert.isNotOk(spanContext.parentId);
        assert.equal(spanContext.flags, 1);
        assert.equal(spanContext.baggage['keyone'], 'leela');
        assert.equal(spanContext.baggage['keytwo'], 'fry');
    });

    it('extract headers when no trace state exists', () => {
        let carrier = {};
        carrier[`${constants.TRACER_BAGGAGE_HEADER_PREFIX}keyOne`] = 'leela';
        carrier[`${constants.TRACER_BAGGAGE_HEADER_PREFIX}keyTwo`] = 'fry';
        let spanContext = codec.extract(carrier);

        assert.isOk(bufferEqual(spanContext.traceId, spanContext.spanId));
        assert.isNotOk(spanContext.parentId);
        assert.equal(spanContext.flags, 1);
        assert.equal(spanContext.baggage['keyone'], 'leela');
        assert.equal(spanContext.baggage['keytwo'], 'fry');
    });

    it('inject span state into headers properly', () => {
        let carrier = {};
        let spanContext = new SpanContext(
            Utils.encodeInt64(1),
            Utils.encodeInt64(2),
            Utils.encodeInt64(3),
            constants.SAMPLED_MASK
        );
        spanContext.setBaggageItem('keyOne', 'leela');
        spanContext.setBaggageItem('keyTwo', 'fry');

        codec.inject(spanContext, carrier);

        assert.equal('0000000000000001:0000000000000002:0000000000000003:1', decodeURIComponent(carrier[`${constants.TRACER_STATE_HEADER_NAME}`]));
        codec.inject(spanContext, carrier);
    });
});
