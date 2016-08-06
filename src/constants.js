export const SAMPLED_MASK = 0x1;
export const DEBUG_MASK = 0x2;
export const headerName = 'UBER-TRACE-ID';
export const headerPrefix = 'UberCtx-';
export const DEFAULT_FLUSH_LENGTH = 10;
export const DEFAULT_INITIAL_SAMPLE_RATE = 0.001;
export const SAMPLER_REFRESH_INTERVAL = 60000;
export const SAMPLER_REFRESH_FAILURES_BEFORE_LOGGING = 50;
export const SAMPLING_TIMEOUT = 5000;
export const SUBMIT_TIMEOUT = 1000;
export const SAMPLING_TIMEOUTS_PER_ATTEMPT = 500;
export const SAMPLING_RETRY_LIMIT = 1;
export const REFERENCE_CHILD_OF = 'child_of';
export const REFERENCE_FOLLOWS_FROM = 'follows_from';
export const FORMAT_BINARY = 'binary';
export const FORMAT_TEXT_MAP = 'text_map';
export const FORMAT_HTTP_HEADERS = 'http_headers';

export const metrics = {
    samplingStrategy: 'sampler.request',
    setSampler: 'sampler.assign',
    spansSubmitted: 'span.submit',
    spanSubmitResponseError: 'span.submit.response.error',
    spanSubmitNotOk: 'span.submit.not_ok'
};
