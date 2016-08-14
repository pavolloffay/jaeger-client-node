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

import * as constants from './constants.js';
import SpanContext from './span_context.js';
import Utils from './util.js';

export default class HttpHeaderCodec {
    _sampler: Sampler;

    constructor(sampler: Sampler) {
        this._sampler = sampler;
    }

    extract(carrier: any): any {
        let header = carrier[`${constants.TRACER_STATE_HEADER_NAME}`];

        let spanContext;
        if (!header) {
            let randomId = Utils.getRandom64();
            let flags = 0;
            if (this._sampler.isSampled()) {
                flags = constants.SAMPLED_MASK;
            }

            spanContext = new SpanContext(
                randomId,
                randomId,
                null,
                flags
            );
        } else {
            spanContext = SpanContext.fromString(decodeURIComponent(header));
        }

        for (let key in carrier) {
            if (carrier.hasOwnProperty(key) && Utils.startsWith(key, constants.TRACER_BAGGAGE_HEADER_PREFIX)) {
                let keyWithoutPrefix = key.substring(constants.TRACER_BAGGAGE_HEADER_PREFIX.length);
                let value = carrier[key];
                spanContext.setBaggageItem(keyWithoutPrefix, value);
            }
        }

        return spanContext;
    }

    inject(spanContext: SpanContext, carrier: any): any {
        let stringSpanContext = spanContext.toString();
        carrier[`${constants.TRACER_STATE_HEADER_NAME}`] = encodeURIComponent(stringSpanContext);

        let baggage = spanContext.baggage;
        for (let key in baggage) {
            if (baggage.hasOwnProperty(key)) {
                let value = spanContext.getBaggageItem(key);
                carrier[`${constants.TRACER_BAGGAGE_HEADER_PREFIX}${key}`] = value;
            }
        }
    }
}
