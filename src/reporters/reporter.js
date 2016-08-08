'use strict';

var assert = require('assert');
var constants = require('./constants.js');
var RateLimiter = require('./leaky_bucket_rate_limiter.js');

exports.TCollectorTraceReporter = TCollectorTraceReporter;
exports.NoopReporter = NoopReporter;
exports.RateLimitingReporter = RateLimitingReporter;

function NoopReporter() {
    if (!(this instanceof NoopReporter)) {
        return new NoopReporter();
    }
}

NoopReporter.prototype.report =
function report() {
};

NoopReporter.prototype.close =
function close(callback) {
    if (callback) {
        callback();
    }
};

/*
 * Instantiates a reporter that rate limits.
 * @constructor
 * @param {Object} reporter - A reporter that you initialize.
 * @param {Number} maxSpansPerSecond - The rate limit is the number of spans per second.
 */
function RateLimitingReporter(reporter, maxSpansPerSecond) {
    if (!(this instanceof RateLimitingReporter)) {
        return new RateLimitingReporter(reporter, maxSpansPerSecond);
    }

    assert(reporter, 'A reporter is required, and must be truthy');
    assert(typeof maxSpansPerSecond === 'number', 'A rateLimit is required, and must be a number');

    this.rateLimiter = RateLimiter(maxSpansPerSecond);
    this.cost = 1;
    this.delegate = reporter;
}

/**
 * A method for storing spans in a buffer. This implementation rate limits
 * the spans reported.
 * @param {Object} span - A span object to be stored in the buffer.
 */
RateLimitingReporter.prototype.report =
function report(span, callback) {
    if (this.rateLimiter.checkCredit(this.cost)) {
        this.delegate.report(span, callback);
    } else {
        if (callback) {
            callback();
        }
    }
};

/*
 * A close method that delegates to another reporters close method.
 * @param {Function} [callback] - A callback to be passed to the delegate close method.
 */
RateLimitingReporter.prototype.close =
function close(callback) {
    this.delegate.close(callback);
};

/**
 * Instantiates a reporter which controls when to write to the proxy, and stores spans.
 * @constructor
 */
function TCollectorTraceReporter(options) {
    var self = this;
    if (!(this instanceof TCollectorTraceReporter)) {
        return new TCollectorTraceReporter(options);
    }

    assert(typeof options.proxy === 'object', 'A proxy is required, and must be an object');

    var flushLength = options.flushLength || constants.DEFAULT_FLUSH_LENGTH;

    self.proxy = options.proxy;
    self.spans = [];
    self.flushLength = flushLength;
}

/**
 * A method for storing spans in a buffer.
 *
 * @param {Object} span - A span object to be stored in the buffer.
 */
TCollectorTraceReporter.prototype.report =
function report(span, callback) {
    var self = this;
    self.spans.push(span);
    if (self.spans.length >= self.flushLength) {
        self._flush(callback);
    }
};

/**
 * A metod for reporting spans stored in this reporter's buffer.
 *
 * @param {Function} [callback] - A callback to execute any actions after a span is submitted.
 */
TCollectorTraceReporter.prototype._flush =
function _flush(callback) {
    var self = this;
    var spans = self.spans;
    self.spans = [];
    self.proxy.submitSpans(spans, callback);
};

/**
 * Should flush spans, and clean up any artifacts of this reporter.
 *
 * @param {Function} [callback] - A callback to execute after flushing.
 */
TCollectorTraceReporter.prototype.close =
function close(callback) {
    var self = this;
    self.flushLength = 0;
    self._flush(function() {
        if (callback) {
            callback();
        }
    });
};
