import process from 'node:process';globalThis._importMeta_={url:import.meta.url,env:process.env};import { tmpdir } from 'node:os';
import { defineEventHandler, handleCacheHeaders, splitCookiesString, createEvent, fetchWithEvent, isEvent, eventHandler, setHeaders, sendRedirect, proxyRequest, getRequestHeader, setResponseHeaders, setResponseStatus, send, getRequestHeaders, setResponseHeader, appendResponseHeader, getRequestURL, getResponseHeader, removeResponseHeader, createError, getQuery as getQuery$1, readBody, createApp, createRouter as createRouter$1, toNodeListener, lazyEventHandler, getResponseStatus, getRouterParam, getResponseStatusText } from 'file:///app/node_modules/h3/dist/index.mjs';
import { Server } from 'node:http';
import { resolve, dirname, join } from 'node:path';
import nodeCrypto from 'node:crypto';
import { parentPort, threadId } from 'node:worker_threads';
import { escapeHtml } from 'file:///app/node_modules/@vue/shared/dist/shared.cjs.js';
import { PrismaClient } from 'file:///app/node_modules/@prisma/client/default.js';
import { createTransport } from 'file:///app/node_modules/nodemailer/lib/nodemailer.js';
import bcrypt from 'file:///app/node_modules/bcrypt/bcrypt.js';
import jwt from 'file:///app/node_modules/jsonwebtoken/index.js';
import { createRenderer, getRequestDependencies, getPreloadLinks, getPrefetchLinks } from 'file:///app/node_modules/vue-bundle-renderer/dist/runtime.mjs';
import { parseURL, withoutBase, joinURL, getQuery, withQuery, withTrailingSlash, decodePath, withLeadingSlash, withoutTrailingSlash, joinRelativeURL } from 'file:///app/node_modules/ufo/dist/index.mjs';
import process$1 from 'node:process';
import { renderToString } from 'file:///app/node_modules/vue/server-renderer/index.mjs';
import destr, { destr as destr$1 } from 'file:///app/node_modules/destr/dist/index.mjs';
import { createHooks } from 'file:///app/node_modules/hookable/dist/index.mjs';
import { createFetch, Headers as Headers$1 } from 'file:///app/node_modules/ofetch/dist/node.mjs';
import { fetchNodeRequestHandler, callNodeRequestHandler } from 'file:///app/node_modules/node-mock-http/dist/index.mjs';
import { createStorage, prefixStorage } from 'file:///app/node_modules/unstorage/dist/index.mjs';
import unstorage_47drivers_47fs from 'file:///app/node_modules/unstorage/drivers/fs.mjs';
import { digest } from 'file:///app/node_modules/ohash/dist/index.mjs';
import { klona } from 'file:///app/node_modules/klona/dist/index.mjs';
import defu, { defuFn } from 'file:///app/node_modules/defu/dist/defu.mjs';
import { snakeCase } from 'file:///app/node_modules/scule/dist/index.mjs';
import { getContext } from 'file:///app/node_modules/unctx/dist/index.mjs';
import { toRouteMatcher, createRouter } from 'file:///app/node_modules/radix3/dist/index.mjs';
import { readFile } from 'node:fs/promises';
import consola, { consola as consola$1 } from 'file:///app/node_modules/consola/dist/index.mjs';
import { ErrorParser } from 'file:///app/node_modules/youch-core/build/index.js';
import { Youch } from 'file:///app/node_modules/youch/build/index.js';
import { SourceMapConsumer } from 'file:///app/node_modules/source-map/source-map.js';
import { AsyncLocalStorage } from 'node:async_hooks';
import { stringify, uneval } from 'file:///app/node_modules/devalue/index.js';
import { captureRawStackTrace, parseRawStackTrace } from 'file:///app/node_modules/errx/dist/index.js';
import { isVNode, toValue, isRef } from 'file:///app/node_modules/vue/index.mjs';
import { promises } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname as dirname$1, resolve as resolve$1 } from 'file:///app/node_modules/pathe/dist/index.mjs';
import { createHead as createHead$1, propsToString, renderSSRHead } from 'file:///app/node_modules/unhead/dist/server.mjs';
import { DeprecationsPlugin, PromisesPlugin, TemplateParamsPlugin, AliasSortingPlugin } from 'file:///app/node_modules/unhead/dist/plugins.mjs';
import { walkResolver } from 'file:///app/node_modules/unhead/dist/utils.mjs';

const serverAssets = [{"baseName":"server","dir":"/app/server/assets"}];

const assets$1 = createStorage();

for (const asset of serverAssets) {
  assets$1.mount(asset.baseName, unstorage_47drivers_47fs({ base: asset.dir, ignore: (asset?.ignore || []) }));
}

const storage = createStorage({});

storage.mount('/assets', assets$1);

storage.mount('root', unstorage_47drivers_47fs({"driver":"fs","readOnly":true,"base":"/app","watchOptions":{"ignored":[null]}}));
storage.mount('src', unstorage_47drivers_47fs({"driver":"fs","readOnly":true,"base":"/app/server","watchOptions":{"ignored":[null]}}));
storage.mount('build', unstorage_47drivers_47fs({"driver":"fs","readOnly":false,"base":"/app/.nuxt"}));
storage.mount('cache', unstorage_47drivers_47fs({"driver":"fs","readOnly":false,"base":"/app/.nuxt/cache"}));
storage.mount('data', unstorage_47drivers_47fs({"driver":"fs","base":"/app/.data/kv"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

const Hasher = /* @__PURE__ */ (() => {
  class Hasher2 {
    buff = "";
    #context = /* @__PURE__ */ new Map();
    write(str) {
      this.buff += str;
    }
    dispatch(value) {
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    }
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      objType = objectLength < 10 ? "unknown:[" + objString + "]" : objString.slice(8, objectLength - 1);
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = this.#context.get(object)) === void 0) {
        this.#context.set(object, this.#context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        this.write("buffer:");
        return this.write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else {
          this.unknown(object, objType);
        }
      } else {
        const keys = Object.keys(object).sort();
        const extraKeys = [];
        this.write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          this.write(":");
          this.dispatch(object[key]);
          this.write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    }
    array(arr, unordered) {
      unordered = unordered === void 0 ? false : unordered;
      this.write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = new Hasher2();
        hasher.dispatch(entry);
        for (const [key, value] of hasher.#context) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      this.#context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    }
    date(date) {
      return this.write("date:" + date.toJSON());
    }
    symbol(sym) {
      return this.write("symbol:" + sym.toString());
    }
    unknown(value, type) {
      this.write(type);
      if (!value) {
        return;
      }
      this.write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          [...value.entries()],
          true
          /* ordered */
        );
      }
    }
    error(err) {
      return this.write("error:" + err.toString());
    }
    boolean(bool) {
      return this.write("bool:" + bool);
    }
    string(string) {
      this.write("string:" + string.length + ":");
      this.write(string);
    }
    function(fn) {
      this.write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
    }
    number(number) {
      return this.write("number:" + number);
    }
    null() {
      return this.write("Null");
    }
    undefined() {
      return this.write("Undefined");
    }
    regexp(regex) {
      return this.write("regex:" + regex.toString());
    }
    arraybuffer(arr) {
      this.write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    }
    url(url) {
      return this.write("url:" + url.toString());
    }
    map(map) {
      this.write("map:");
      const arr = [...map];
      return this.array(arr, false);
    }
    set(set) {
      this.write("set:");
      const arr = [...set];
      return this.array(arr, false);
    }
    bigint(number) {
      return this.write("bigint:" + number.toString());
    }
  }
  for (const type of [
    "uint8array",
    "uint8clampedarray",
    "unt8array",
    "uint16array",
    "unt16array",
    "uint32array",
    "unt32array",
    "float32array",
    "float64array"
  ]) {
    Hasher2.prototype[type] = function(arr) {
      this.write(type + ":");
      return this.array([...arr], false);
    };
  }
  function isNativeFunction(f) {
    if (typeof f !== "function") {
      return false;
    }
    return Function.prototype.toString.call(f).slice(
      -15
      /* "[native code] }".length */
    ) === "[native code] }";
  }
  return Hasher2;
})();
function serialize(object) {
  const hasher = new Hasher();
  hasher.dispatch(object);
  return hasher.buff;
}
function hash(value) {
  return digest(typeof value === "string" ? value : serialize(value)).replace(/[-_]/g, "").slice(0, 10);
}

function defaultCacheOptions() {
  return {
    name: "_",
    base: "/cache",
    swr: true,
    maxAge: 1
  };
}
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions(), ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    let entry = await useStorage().getItem(cacheKey).catch((error) => {
      console.error(`[cache] Cache read error.`, error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }) || {};
    if (typeof entry !== "object") {
      entry = {};
      const error = new Error("Malformed data read from cache.");
      console.error("[cache]", error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }
    const ttl = (opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          let setOpts;
          if (opts.maxAge && !opts.swr) {
            setOpts = { ttl: opts.maxAge };
          }
          const promise = useStorage().setItem(cacheKey, entry, setOpts).catch((error) => {
            console.error(`[cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event?.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = await opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = await opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
function cachedFunction(fn, opts = {}) {
  return defineCachedFunction(fn, opts);
}
function getKey(...args) {
  return args.length > 0 ? hash(args) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions()) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      let _pathname;
      try {
        _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      } catch {
        _pathname = "-";
      }
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        const value = incomingEvent.node.req.headers[header];
        if (value !== void 0) {
          variableHeaders[header] = value;
        }
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2(void 0);
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return true;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            if (Array.isArray(headers2) || typeof headers2 === "string") {
              throw new TypeError("Raw headers  is not supported.");
            }
            for (const header in headers2) {
              const value = headers2[header];
              if (value !== void 0) {
                this.setHeader(
                  header,
                  value
                );
              }
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: useNitroApp().localFetch
      });
      event.$fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: globalThis.$fetch
      });
      event.waitUntil = incomingEvent.waitUntil;
      event.context = incomingEvent.context;
      event.context.cache = {
        options: _opts
      };
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(
      event
    );
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString(value)
        );
      } else {
        if (value !== void 0) {
          event.node.res.setHeader(name, value);
        }
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

const inlineAppConfig = {
  "nuxt": {}
};



const appConfig = defuFn(inlineAppConfig);

function getEnv(key, opts) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function applyEnv(obj, opts, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey, opts);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
        applyEnv(obj[key], opts, subKey);
      } else if (envValue === void 0) {
        applyEnv(obj[key], opts, subKey);
      } else {
        obj[key] = envValue ?? obj[key];
      }
    } else {
      obj[key] = envValue ?? obj[key];
    }
    if (opts.envExpansion && typeof obj[key] === "string") {
      obj[key] = _expandFromEnv(obj[key]);
    }
  }
  return obj;
}
const envExpandRx = /\{\{([^{}]*)\}\}/g;
function _expandFromEnv(value) {
  return value.replace(envExpandRx, (match, key) => {
    return process.env[key] || match;
  });
}

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/",
    "buildId": "dev",
    "buildAssetsDir": "/_nuxt/",
    "cdnURL": ""
  },
  "nitro": {
    "envPrefix": "NUXT_",
    "routeRules": {
      "/__nuxt_error": {
        "cache": false
      },
      "/_nuxt/builds/meta/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      },
      "/_nuxt/builds/**": {
        "headers": {
          "cache-control": "public, max-age=1, immutable"
        }
      }
    }
  },
  "public": {}
};
const envOptions = {
  prefix: "NITRO_",
  altPrefix: _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_",
  envExpansion: _inlineRuntimeConfig.nitro.envExpansion ?? process.env.NITRO_ENV_EXPANSION ?? false
};
const _sharedRuntimeConfig = _deepFreeze(
  applyEnv(klona(_inlineRuntimeConfig), envOptions)
);
function useRuntimeConfig(event) {
  if (!event) {
    return _sharedRuntimeConfig;
  }
  if (event.context.nitro.runtimeConfig) {
    return event.context.nitro.runtimeConfig;
  }
  const runtimeConfig = klona(_inlineRuntimeConfig);
  applyEnv(runtimeConfig, envOptions);
  event.context.nitro.runtimeConfig = runtimeConfig;
  return runtimeConfig;
}
_deepFreeze(klona(appConfig));
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

getContext("nitro-app", {
  asyncContext: false,
  AsyncLocalStorage: void 0
});

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      let target = routeRules.redirect.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.redirect._redirectStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return sendRedirect(event, target, routeRules.redirect.statusCode);
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError(error, { tags: [type] });
}
function trapUnhandledNodeErrors() {
  process.on(
    "unhandledRejection",
    (error) => _captureError(error, "unhandledRejection")
  );
  process.on(
    "uncaughtException",
    (error) => _captureError(error, "uncaughtException")
  );
}
function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

function isJsonRequest(event) {
  if (hasReqHeader(event, "accept", "text/html")) {
    return false;
  }
  return hasReqHeader(event, "accept", "application/json") || hasReqHeader(event, "user-agent", "curl/") || hasReqHeader(event, "user-agent", "httpie/") || hasReqHeader(event, "sec-fetch-mode", "cors") || event.path.startsWith("/api/") || event.path.endsWith(".json");
}
function hasReqHeader(event, name, includes) {
  const value = getRequestHeader(event, name);
  return value && typeof value === "string" && value.toLowerCase().includes(includes);
}

const iframeStorageBridge = (nonce) => (
  /* js */
  `
(function() {
  const memoryStore = {};

  const NONCE = ${JSON.stringify(nonce)}
  
  const mockStorage = {
    getItem: function(key) {
      return memoryStore[key] !== undefined ? memoryStore[key] : null;
    },
    setItem: function(key, value) {
      memoryStore[key] = String(value);
      window.parent.postMessage({
        type: 'storage-set',
        key: key,
        value: String(value),
        nonce: NONCE
      }, '*');
    },
    removeItem: function(key) {
      delete memoryStore[key];
      window.parent.postMessage({
        type: 'storage-remove',
        key: key,
        nonce: NONCE
      }, '*');
    },
    clear: function() {
      for (const key in memoryStore) {
        delete memoryStore[key];
      }
      window.parent.postMessage({
        type: 'storage-clear',
        nonce: NONCE
      }, '*');
    },
    key: function(index) {
      const keys = Object.keys(memoryStore);
      return keys[index] !== undefined ? keys[index] : null;
    },
    get length() {
      return Object.keys(memoryStore).length;
    }
  };
  
  try {
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: false,
      configurable: true
    });
  } catch (e) {
    window.localStorage = mockStorage;
  }
  
  window.addEventListener('message', function(event) {
    if (event.data.type === 'storage-sync-data' && event.data.nonce === NONCE) {
      const data = event.data.data;
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          memoryStore[key] = data[key];
        }
      }
      if (typeof window.initTheme === 'function') {
        window.initTheme();
      }
      window.dispatchEvent(new Event('storage-ready'));
    }
  });
  
  window.parent.postMessage({ 
    type: 'storage-sync-request',
    nonce: NONCE
  }, '*');
})();
`
);
const parentStorageBridge = (nonce) => (
  /* js */
  `
(function() {
  const host = document.querySelector('nuxt-error-overlay');
  if (!host) return;
  
  // Wait for shadow root to be attached
  const checkShadow = setInterval(function() {
    if (host.shadowRoot) {
      clearInterval(checkShadow);
      const iframe = host.shadowRoot.getElementById('frame');
      if (!iframe) return;

      const NONCE = ${JSON.stringify(nonce)}
      
      window.addEventListener('message', function(event) {
        if (!event.data || event.data.nonce !== NONCE) return;
        
        const data = event.data;
        
        if (data.type === 'storage-set') {
          localStorage.setItem(data.key, data.value);
        } else if (data.type === 'storage-remove') {
          localStorage.removeItem(data.key);
        } else if (data.type === 'storage-clear') {
          localStorage.clear();
        } else if (data.type === 'storage-sync-request') {
          const allData = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            allData[key] = localStorage.getItem(key);
          }
          iframe.contentWindow.postMessage({
            type: 'storage-sync-data',
            data: allData,
            nonce: NONCE
          }, '*');
        }
      });
    }
  }, 10);
})();
`
);
const errorCSS = (
  /* css */
  `
:host {
  --preview-width: 240px;
  --preview-height: 180px;
  --base-width: 1200px;
  --base-height: 900px;
  --z-base: 999999998;
  all: initial;
  display: contents;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
#frame {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  border: none;
  z-index: var(--z-base);
}
#frame[inert] {
  right: 5px;
  bottom: 5px;
  left: auto;
  top: auto;
  width: var(--base-width);
  height: var(--base-height);
  transform: scale(calc(240 / 1200));
  transform-origin: bottom right;
  overflow: hidden;
  border-radius: calc(1200 * 8px / 240);
}
#preview {
  position: fixed;
  right: 5px;
  bottom: 5px;
  width: var(--preview-width);
  height: var(--preview-height);
  overflow: hidden;
  border-radius: 8px;
  pointer-events: none;
  z-index: var(--z-base);
  background: white;
  display: none;
}
#frame:not([inert]) + #preview {
  display: block;
}
#toggle {
  position: fixed;
  right: 5px;
  bottom: 5px;
  width: var(--preview-width);
  height: var(--preview-height);
  background: none;
  border: 3px solid #00DC82;
  border-radius: 8px;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s, box-shadow 0.2s;
  z-index: calc(var(--z-base) + 1);
}
#toggle:hover,
#toggle:focus {
  opacity: 1;
  box-shadow: 0 0 20px rgba(0, 220, 130, 0.6);
}
#toggle:focus-visible {
  outline: 3px solid #00DC82;
  outline-offset: 3px;
  box-shadow: 0 0 24px rgba(0, 220, 130, 0.8);
}
@media (prefers-reduced-motion: reduce) {
  #toggle {
    transition: none;
  }
}
`
);
function webComponentScript(base64HTML, startMinimized) {
  return (
    /* js */
    `
  (function() {
    try {
      const host = document.querySelector('nuxt-error-overlay');
      if (!host) return;
      
      const shadow = host.attachShadow({ mode: 'open' });
      
      // Create elements
      const style = document.createElement('style');
      style.textContent = ${JSON.stringify(errorCSS)};
      
      const iframe = document.createElement('iframe');
      iframe.id = 'frame';
      iframe.src = 'data:text/html;base64,${base64HTML}';
      iframe.title = 'Detailed error stack trace';
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      
      const preview = document.createElement('div');
      preview.id = 'preview';
      
      const button = document.createElement('button');
      button.id = 'toggle';
      button.setAttribute('aria-expanded', 'true');
      button.setAttribute('type', 'button');
      button.innerHTML = '<span class="sr-only">Toggle detailed error view</span>';
      
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.className = 'sr-only';
      
      // Update preview snapshot
      function updatePreview() {
        try {
          let previewIframe = preview.querySelector('iframe');
          if (!previewIframe) {
            previewIframe = document.createElement('iframe');
            previewIframe.style.cssText = 'width: 1200px; height: 900px; transform: scale(0.2); transform-origin: top left; border: none;';
            previewIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
            preview.appendChild(previewIframe);
          }
          
          const doctype = document.doctype ? '<!DOCTYPE ' + document.doctype.name + '>' : '';
          const cleanedHTML = document.documentElement.outerHTML
            .replace(/<nuxt-error-overlay[^>]*>.*?<\\/nuxt-error-overlay>/gs, '')
            .replace(/<script[^>]*>.*?<\\/script>/gs, '');
          
          const iframeDoc = previewIframe.contentDocument || previewIframe.contentWindow.document;
          iframeDoc.open();
          iframeDoc.write(doctype + cleanedHTML);
          iframeDoc.close();
        } catch (error) {
          console.error('Failed to update preview:', error);
        }
      }
      
      function toggleView() {
        const isMinimized = iframe.hasAttribute('inert');
        
        if (isMinimized) {
          updatePreview();
          iframe.removeAttribute('inert');
          button.setAttribute('aria-expanded', 'true');
          liveRegion.textContent = 'Showing detailed error view';
          setTimeout(function() {
            try { iframe.contentWindow.focus(); } catch {}
          }, 100);
        } else {
          iframe.setAttribute('inert', '');
          button.setAttribute('aria-expanded', 'false');
          liveRegion.textContent = 'Showing error page';
          button.focus();
        }
      }
      
      button.onclick = toggleView;
      
      document.addEventListener('keydown', function(e) {
        if ((e.key === 'Escape' || e.key === 'Esc') && !iframe.hasAttribute('inert')) {
          toggleView();
        }
      });
      
      // Append to shadow DOM
      shadow.appendChild(style);
      shadow.appendChild(liveRegion);
      shadow.appendChild(iframe);
      shadow.appendChild(preview);
      shadow.appendChild(button);
      
      if (${startMinimized}) {
        iframe.setAttribute('inert', '');
        button.setAttribute('aria-expanded', 'false');
      }
      
      // Initialize preview
      setTimeout(updatePreview, 100);
      
    } catch (error) {
      console.error('Failed to initialize Nuxt error overlay:', error);
    }
  })();
  `
  );
}
function generateErrorOverlayHTML(html, options) {
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  const errorPage = html.replace("<head>", `<head><script>${iframeStorageBridge(nonce)}<\/script>`);
  const base64HTML = Buffer.from(errorPage, "utf8").toString("base64");
  return `
    <script>${parentStorageBridge(nonce)}<\/script>
    <nuxt-error-overlay></nuxt-error-overlay>
    <script>${webComponentScript(base64HTML, options?.startMinimized ?? false)}<\/script>
  `;
}

const errorHandler$0 = (async function errorhandler(error, event, { defaultHandler }) {
  if (event.handled || isJsonRequest(event)) {
    return;
  }
  const defaultRes = await defaultHandler(error, event, { json: true });
  const statusCode = error.statusCode || 500;
  if (statusCode === 404 && defaultRes.status === 302) {
    setResponseHeaders(event, defaultRes.headers);
    setResponseStatus(event, defaultRes.status, defaultRes.statusText);
    return send(event, JSON.stringify(defaultRes.body, null, 2));
  }
  if (typeof defaultRes.body !== "string" && Array.isArray(defaultRes.body.stack)) {
    defaultRes.body.stack = defaultRes.body.stack.join("\n");
  }
  const errorObject = defaultRes.body;
  const url = new URL(errorObject.url);
  errorObject.url = withoutBase(url.pathname, useRuntimeConfig(event).app.baseURL) + url.search + url.hash;
  errorObject.message ||= "Server Error";
  errorObject.data ||= error.data;
  errorObject.statusMessage ||= error.statusMessage;
  delete defaultRes.headers["content-type"];
  delete defaultRes.headers["content-security-policy"];
  setResponseHeaders(event, defaultRes.headers);
  const reqHeaders = getRequestHeaders(event);
  const isRenderingError = event.path.startsWith("/__nuxt_error") || !!reqHeaders["x-nuxt-error"];
  const res = isRenderingError ? null : await useNitroApp().localFetch(
    withQuery(joinURL(useRuntimeConfig(event).app.baseURL, "/__nuxt_error"), errorObject),
    {
      headers: { ...reqHeaders, "x-nuxt-error": "true" },
      redirect: "manual"
    }
  ).catch(() => null);
  if (event.handled) {
    return;
  }
  if (!res) {
    const { template } = await Promise.resolve().then(function () { return error500; });
    {
      errorObject.description = errorObject.message;
    }
    setResponseHeader(event, "Content-Type", "text/html;charset=UTF-8");
    return send(event, template(errorObject));
  }
  const html = await res.text();
  for (const [header, value] of res.headers.entries()) {
    if (header === "set-cookie") {
      appendResponseHeader(event, header, value);
      continue;
    }
    setResponseHeader(event, header, value);
  }
  setResponseStatus(event, res.status && res.status !== 200 ? res.status : defaultRes.status, res.statusText || defaultRes.statusText);
  {
    const prettyResponse = await defaultHandler(error, event, { json: false });
    return send(event, html.replace("</body>", `${generateErrorOverlayHTML(prettyResponse.body, { startMinimized: 300 <= statusCode && statusCode < 500 })}</body>`));
  }
});

function defineNitroErrorHandler(handler) {
  return handler;
}

const errorHandler$1 = defineNitroErrorHandler(
  async function defaultNitroErrorHandler(error, event) {
    const res = await defaultHandler(error, event);
    if (!event.node?.res.headersSent) {
      setResponseHeaders(event, res.headers);
    }
    setResponseStatus(event, res.status, res.statusText);
    return send(
      event,
      typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2)
    );
  }
);
async function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled || error.fatal;
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage || "Server Error";
  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true });
  if (statusCode === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  await loadStackTrace(error).catch(consola.error);
  const youch = new Youch();
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]", error.fatal && "[fatal]"].filter(Boolean).join(" ");
    const ansiError = await (await youch.toANSI(error)).replaceAll(process.cwd(), ".");
    consola.error(
      `[request error] ${tags} [${event.method}] ${url}

`,
      ansiError
    );
  }
  const useJSON = opts?.json || !getRequestHeader(event, "accept")?.includes("text/html");
  const headers = {
    "content-type": useJSON ? "application/json" : "text/html",
    // Prevent browser from guessing the MIME types of resources.
    "x-content-type-options": "nosniff",
    // Prevent error page from being embedded in an iframe
    "x-frame-options": "DENY",
    // Prevent browsers from sending the Referer header
    "referrer-policy": "no-referrer",
    // Disable the execution of any js
    "content-security-policy": "script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self';"
  };
  if (statusCode === 404 || !getResponseHeader(event, "cache-control")) {
    headers["cache-control"] = "no-cache";
  }
  const body = useJSON ? {
    error: true,
    url,
    statusCode,
    statusMessage,
    message: error.message,
    data: error.data,
    stack: error.stack?.split("\n").map((line) => line.trim())
  } : await youch.toHTML(error, {
    request: {
      url: url.href,
      method: event.method,
      headers: getRequestHeaders(event)
    }
  });
  return {
    status: statusCode,
    statusText: statusMessage,
    headers,
    body
  };
}
async function loadStackTrace(error) {
  if (!(error instanceof Error)) {
    return;
  }
  const parsed = await new ErrorParser().defineSourceLoader(sourceLoader).parse(error);
  const stack = error.message + "\n" + parsed.frames.map((frame) => fmtFrame(frame)).join("\n");
  Object.defineProperty(error, "stack", { value: stack });
  if (error.cause) {
    await loadStackTrace(error.cause).catch(consola.error);
  }
}
async function sourceLoader(frame) {
  if (!frame.fileName || frame.fileType !== "fs" || frame.type === "native") {
    return;
  }
  if (frame.type === "app") {
    const rawSourceMap = await readFile(`${frame.fileName}.map`, "utf8").catch(() => {
    });
    if (rawSourceMap) {
      const consumer = await new SourceMapConsumer(rawSourceMap);
      const originalPosition = consumer.originalPositionFor({ line: frame.lineNumber, column: frame.columnNumber });
      if (originalPosition.source && originalPosition.line) {
        frame.fileName = resolve(dirname(frame.fileName), originalPosition.source);
        frame.lineNumber = originalPosition.line;
        frame.columnNumber = originalPosition.column || 0;
      }
    }
  }
  const contents = await readFile(frame.fileName, "utf8").catch(() => {
  });
  return contents ? { contents } : void 0;
}
function fmtFrame(frame) {
  if (frame.type === "native") {
    return frame.raw;
  }
  const src = `${frame.fileName || ""}:${frame.lineNumber}:${frame.columnNumber})`;
  return frame.functionName ? `at ${frame.functionName} (${src}` : `at ${src}`;
}

const errorHandlers = [errorHandler$0, errorHandler$1];

async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      await handler(error, event, { defaultHandler });
      if (event.handled) {
        return; // Response handled
      }
    } catch(error) {
      // Handler itself thrown, log and continue
      console.error(error);
    }
  }
  // H3 will handle fallback
}

const script = `
if (!window.__NUXT_DEVTOOLS_TIME_METRIC__) {
  Object.defineProperty(window, '__NUXT_DEVTOOLS_TIME_METRIC__', {
    value: {},
    enumerable: false,
    configurable: true,
  })
}
window.__NUXT_DEVTOOLS_TIME_METRIC__.appInit = Date.now()
`;

const _FMnHxsRb1XnhSkgrcxwDEP1elfSPjrP7Wr27yXkb3Aw = (function(nitro) {
  nitro.hooks.hook("render:html", (htmlContext) => {
    htmlContext.head.push(`<script>${script}<\/script>`);
  });
});

function defineNitroPlugin(def) {
  return def;
}

const prisma$o = new PrismaClient();
const _aIQNJBgajH95T2G3WQbulkLX3hjPiBtkWRLnpkQYumM = defineNitroPlugin((nitroApp) => {
  console.log("\u2705 Prisma plugin carregado");
  nitroApp.hooks.hook("request", (event) => {
    event.context.prisma = prisma$o;
  });
});

const rootDir = "/app";

const appHead = {"meta":[{"name":"viewport","content":"width=device-width, initial-scale=1"},{"charset":"utf-8"}],"link":[],"style":[],"script":[],"noscript":[]};

const appRootTag = "div";

const appRootAttrs = {"id":"__nuxt"};

const appTeleportTag = "div";

const appTeleportAttrs = {"id":"teleports"};

const appId = "nuxt-app";

const devReducers = {
  VNode: (data) => isVNode(data) ? { type: data.type, props: data.props } : void 0,
  URL: (data) => data instanceof URL ? data.toString() : void 0
};
const asyncContext = getContext("nuxt-dev", { asyncContext: true, AsyncLocalStorage });
const _1xyvuM2CQDhMlDxE8qY1t3Wi66ocgNUNDNce4pREOrU = (nitroApp) => {
  const handler = nitroApp.h3App.handler;
  nitroApp.h3App.handler = (event) => {
    return asyncContext.callAsync({ logs: [], event }, () => handler(event));
  };
  onConsoleLog((_log) => {
    const ctx = asyncContext.tryUse();
    if (!ctx) {
      return;
    }
    const rawStack = captureRawStackTrace();
    if (!rawStack || rawStack.includes("runtime/vite-node.mjs")) {
      return;
    }
    const trace = [];
    let filename = "";
    for (const entry of parseRawStackTrace(rawStack)) {
      if (entry.source === globalThis._importMeta_.url) {
        continue;
      }
      if (EXCLUDE_TRACE_RE.test(entry.source)) {
        continue;
      }
      filename ||= entry.source.replace(withTrailingSlash(rootDir), "");
      trace.push({
        ...entry,
        source: entry.source.startsWith("file://") ? entry.source.replace("file://", "") : entry.source
      });
    }
    const log = {
      ..._log,
      // Pass along filename to allow the client to display more info about where log comes from
      filename,
      // Clean up file names in stack trace
      stack: trace
    };
    ctx.logs.push(log);
  });
  nitroApp.hooks.hook("afterResponse", () => {
    const ctx = asyncContext.tryUse();
    if (!ctx) {
      return;
    }
    return nitroApp.hooks.callHook("dev:ssr-logs", { logs: ctx.logs, path: ctx.event.path });
  });
  nitroApp.hooks.hook("render:html", (htmlContext) => {
    const ctx = asyncContext.tryUse();
    if (!ctx) {
      return;
    }
    try {
      const reducers = Object.assign(/* @__PURE__ */ Object.create(null), devReducers, ctx.event.context._payloadReducers);
      htmlContext.bodyAppend.unshift(`<script type="application/json" data-nuxt-logs="${appId}">${stringify(ctx.logs, reducers)}<\/script>`);
    } catch (e) {
      const shortError = e instanceof Error && "toString" in e ? ` Received \`${e.toString()}\`.` : "";
      console.warn(`[nuxt] Failed to stringify dev server logs.${shortError} You can define your own reducer/reviver for rich types following the instructions in https://nuxt.com/docs/api/composables/use-nuxt-app#payload.`);
    }
  });
};
const EXCLUDE_TRACE_RE = /\/node_modules\/(?:.*\/)?(?:nuxt|nuxt-nightly|nuxt-edge|nuxt3|consola|@vue)\/|core\/runtime\/nitro/;
function onConsoleLog(callback) {
  consola$1.addReporter({
    log(logObj) {
      callback(logObj);
    }
  });
  consola$1.wrapConsole();
}

const plugins = [
  _FMnHxsRb1XnhSkgrcxwDEP1elfSPjrP7Wr27yXkb3Aw,
_aIQNJBgajH95T2G3WQbulkLX3hjPiBtkWRLnpkQYumM,
_1xyvuM2CQDhMlDxE8qY1t3Wi66ocgNUNDNce4pREOrU
];

const assets = {};

function readAsset (id) {
  const serverDir = dirname$1(fileURLToPath(globalThis._importMeta_.url));
  return promises.readFile(resolve$1(serverDir, assets[id].path))
}

const publicAssetBases = {"/_nuxt/builds/meta/":{"maxAge":31536000},"/_nuxt/builds/":{"maxAge":1}};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = { gzip: ".gz", br: ".br" };
const _oStzCE = eventHandler((event) => {
  if (event.method && !METHODS.has(event.method)) {
    return;
  }
  let id = decodePath(
    withLeadingSlash(withoutTrailingSlash(parseURL(event.path).pathname))
  );
  let asset;
  const encodingHeader = String(
    getRequestHeader(event, "accept-encoding") || ""
  );
  const encodings = [
    ...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(),
    ""
  ];
  if (encodings.length > 1) {
    appendResponseHeader(event, "Vary", "Accept-Encoding");
  }
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      removeResponseHeader(event, "Cache-Control");
      throw createError({ statusCode: 404 });
    }
    return;
  }
  const ifNotMatch = getRequestHeader(event, "if-none-match") === asset.etag;
  if (ifNotMatch) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  const ifModifiedSinceH = getRequestHeader(event, "if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  if (asset.type && !getResponseHeader(event, "Content-Type")) {
    setResponseHeader(event, "Content-Type", asset.type);
  }
  if (asset.etag && !getResponseHeader(event, "ETag")) {
    setResponseHeader(event, "ETag", asset.etag);
  }
  if (asset.mtime && !getResponseHeader(event, "Last-Modified")) {
    setResponseHeader(event, "Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !getResponseHeader(event, "Content-Encoding")) {
    setResponseHeader(event, "Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !getResponseHeader(event, "Content-Length")) {
    setResponseHeader(event, "Content-Length", asset.size);
  }
  return readAsset(id);
});

const VueResolver = (_, value) => {
  return isRef(value) ? toValue(value) : value;
};

const headSymbol = "usehead";
// @__NO_SIDE_EFFECTS__
function vueInstall(head) {
  const plugin = {
    install(app) {
      app.config.globalProperties.$unhead = head;
      app.config.globalProperties.$head = head;
      app.provide(headSymbol, head);
    }
  };
  return plugin.install;
}

// @__NO_SIDE_EFFECTS__
function resolveUnrefHeadInput(input) {
  return walkResolver(input, VueResolver);
}

// @__NO_SIDE_EFFECTS__
function createHead(options = {}) {
  const head = createHead$1({
    ...options,
    propResolvers: [VueResolver]
  });
  head.install = vueInstall(head);
  return head;
}

const unheadOptions = {
  disableDefaults: true,
  disableCapoSorting: false,
  plugins: [DeprecationsPlugin, PromisesPlugin, TemplateParamsPlugin, AliasSortingPlugin],
};

function createSSRContext(event) {
  const ssrContext = {
    url: event.path,
    event,
    runtimeConfig: useRuntimeConfig(event),
    noSSR: true,
    head: createHead(unheadOptions),
    error: false,
    nuxt: void 0,
    /* NuxtApp */
    payload: {},
    _payloadReducers: /* @__PURE__ */ Object.create(null),
    modules: /* @__PURE__ */ new Set()
  };
  return ssrContext;
}
function setSSRError(ssrContext, error) {
  ssrContext.error = true;
  ssrContext.payload = { error };
  ssrContext.url = error.url;
}

function buildAssetsDir() {
  return useRuntimeConfig().app.buildAssetsDir;
}
function buildAssetsURL(...path) {
  return joinRelativeURL(publicAssetsURL(), buildAssetsDir(), ...path);
}
function publicAssetsURL(...path) {
  const app = useRuntimeConfig().app;
  const publicBase = app.cdnURL || app.baseURL;
  return path.length ? joinRelativeURL(publicBase, ...path) : publicBase;
}

const APP_ROOT_OPEN_TAG = `<${appRootTag}${propsToString(appRootAttrs)}>`;
const APP_ROOT_CLOSE_TAG = `</${appRootTag}>`;
const getServerEntry = () => Promise.resolve().then(function () { return server$1; }).then((r) => r.default || r);
const getClientManifest = () => import('file:///app/.nuxt//dist/server/client.manifest.mjs').then((r) => r.default || r).then((r) => typeof r === "function" ? r() : r);
const getSSRRenderer = lazyCachedFunction(async () => {
  const createSSRApp = await getServerEntry();
  if (!createSSRApp) {
    throw new Error("Server bundle is not available");
  }
  const precomputed = void 0 ;
  const renderer = createRenderer(createSSRApp, {
    precomputed,
    manifest: await getClientManifest() ,
    renderToString: renderToString$1,
    buildAssetsURL
  });
  async function renderToString$1(input, context) {
    const html = await renderToString(input, context);
    if (process$1.env.NUXT_VITE_NODE_OPTIONS) {
      renderer.rendererContext.updateManifest(await getClientManifest());
    }
    return APP_ROOT_OPEN_TAG + html + APP_ROOT_CLOSE_TAG;
  }
  return renderer;
});
const getSPARenderer = lazyCachedFunction(async () => {
  const precomputed = void 0 ;
  const spaTemplate = await Promise.resolve().then(function () { return _virtual__spaTemplate; }).then((r) => r.template).catch(() => "").then((r) => {
    {
      return APP_ROOT_OPEN_TAG + r + APP_ROOT_CLOSE_TAG;
    }
  });
  const renderer = createRenderer(() => () => {
  }, {
    precomputed,
    manifest: await getClientManifest() ,
    renderToString: () => spaTemplate,
    buildAssetsURL
  });
  const result = await renderer.renderToString({});
  const renderToString = (ssrContext) => {
    const config = useRuntimeConfig(ssrContext.event);
    ssrContext.modules ||= /* @__PURE__ */ new Set();
    ssrContext.payload.serverRendered = false;
    ssrContext.config = {
      public: config.public,
      app: config.app
    };
    return Promise.resolve(result);
  };
  return {
    rendererContext: renderer.rendererContext,
    renderToString
  };
});
function lazyCachedFunction(fn) {
  let res = null;
  return () => {
    if (res === null) {
      res = fn().catch((err) => {
        res = null;
        throw err;
      });
    }
    return res;
  };
}
function getRenderer(ssrContext) {
  return getSPARenderer() ;
}
const getSSRStyles = lazyCachedFunction(() => Promise.resolve().then(function () { return styles$1; }).then((r) => r.default || r));

async function renderInlineStyles(usedModules) {
  const styleMap = await getSSRStyles();
  const inlinedStyles = /* @__PURE__ */ new Set();
  for (const mod of usedModules) {
    if (mod in styleMap && styleMap[mod]) {
      for (const style of await styleMap[mod]()) {
        inlinedStyles.add(style);
      }
    }
  }
  return Array.from(inlinedStyles).map((style) => ({ innerHTML: style }));
}

const ROOT_NODE_REGEX = new RegExp(`^<${appRootTag}[^>]*>([\\s\\S]*)<\\/${appRootTag}>$`);
function getServerComponentHTML(body) {
  const match = body.match(ROOT_NODE_REGEX);
  return match?.[1] || body;
}
const SSR_SLOT_TELEPORT_MARKER = /^uid=([^;]*);slot=(.*)$/;
const SSR_CLIENT_TELEPORT_MARKER = /^uid=([^;]*);client=(.*)$/;
const SSR_CLIENT_SLOT_MARKER = /^island-slot=([^;]*);(.*)$/;
function getSlotIslandResponse(ssrContext) {
  if (!ssrContext.islandContext || !Object.keys(ssrContext.islandContext.slots).length) {
    return void 0;
  }
  const response = {};
  for (const [name, slot] of Object.entries(ssrContext.islandContext.slots)) {
    response[name] = {
      ...slot,
      fallback: ssrContext.teleports?.[`island-fallback=${name}`]
    };
  }
  return response;
}
function getClientIslandResponse(ssrContext) {
  if (!ssrContext.islandContext || !Object.keys(ssrContext.islandContext.components).length) {
    return void 0;
  }
  const response = {};
  for (const [clientUid, component] of Object.entries(ssrContext.islandContext.components)) {
    const html = ssrContext.teleports?.[clientUid]?.replaceAll("<!--teleport start anchor-->", "") || "";
    response[clientUid] = {
      ...component,
      html,
      slots: getComponentSlotTeleport(clientUid, ssrContext.teleports ?? {})
    };
  }
  return response;
}
function getComponentSlotTeleport(clientUid, teleports) {
  const entries = Object.entries(teleports);
  const slots = {};
  for (const [key, value] of entries) {
    const match = key.match(SSR_CLIENT_SLOT_MARKER);
    if (match) {
      const [, id, slot] = match;
      if (!slot || clientUid !== id) {
        continue;
      }
      slots[slot] = value;
    }
  }
  return slots;
}
function replaceIslandTeleports(ssrContext, html) {
  const { teleports, islandContext } = ssrContext;
  if (islandContext || !teleports) {
    return html;
  }
  for (const key in teleports) {
    const matchClientComp = key.match(SSR_CLIENT_TELEPORT_MARKER);
    if (matchClientComp) {
      const [, uid, clientId] = matchClientComp;
      if (!uid || !clientId) {
        continue;
      }
      html = html.replace(new RegExp(` data-island-uid="${uid}" data-island-component="${clientId}"[^>]*>`), (full) => {
        return full + teleports[key];
      });
      continue;
    }
    const matchSlot = key.match(SSR_SLOT_TELEPORT_MARKER);
    if (matchSlot) {
      const [, uid, slot] = matchSlot;
      if (!uid || !slot) {
        continue;
      }
      html = html.replace(new RegExp(` data-island-uid="${uid}" data-island-slot="${slot}"[^>]*>`), (full) => {
        return full + teleports[key];
      });
    }
  }
  return html;
}

const ISLAND_SUFFIX_RE = /\.json(?:\?.*)?$/;
const _SxA8c9 = defineEventHandler(async (event) => {
  const nitroApp = useNitroApp();
  setResponseHeaders(event, {
    "content-type": "application/json;charset=utf-8",
    "x-powered-by": "Nuxt"
  });
  const islandContext = await getIslandContext(event);
  const ssrContext = {
    ...createSSRContext(event),
    islandContext,
    noSSR: false,
    url: islandContext.url
  };
  const renderer = await getSSRRenderer();
  const renderResult = await renderer.renderToString(ssrContext).catch(async (err) => {
    await ssrContext.nuxt?.hooks.callHook("app:error", err);
    throw err;
  });
  if (ssrContext.payload?.error) {
    throw ssrContext.payload.error;
  }
  const inlinedStyles = await renderInlineStyles(ssrContext.modules ?? []);
  await ssrContext.nuxt?.hooks.callHook("app:rendered", { ssrContext, renderResult });
  if (inlinedStyles.length) {
    ssrContext.head.push({ style: inlinedStyles });
  }
  {
    const { styles } = getRequestDependencies(ssrContext, renderer.rendererContext);
    const link = [];
    for (const resource of Object.values(styles)) {
      if ("inline" in getQuery(resource.file)) {
        continue;
      }
      if (resource.file.includes("scoped") && !resource.file.includes("pages/")) {
        link.push({ rel: "stylesheet", href: renderer.rendererContext.buildAssetsURL(resource.file), crossorigin: "" });
      }
    }
    if (link.length) {
      ssrContext.head.push({ link }, { mode: "server" });
    }
  }
  const islandHead = {};
  for (const entry of ssrContext.head.entries.values()) {
    for (const [key, value] of Object.entries(resolveUnrefHeadInput(entry.input))) {
      const currentValue = islandHead[key];
      if (Array.isArray(currentValue)) {
        currentValue.push(...value);
      }
      islandHead[key] = value;
    }
  }
  islandHead.link ||= [];
  islandHead.style ||= [];
  const islandResponse = {
    id: islandContext.id,
    head: islandHead,
    html: getServerComponentHTML(renderResult.html),
    components: getClientIslandResponse(ssrContext),
    slots: getSlotIslandResponse(ssrContext)
  };
  await nitroApp.hooks.callHook("render:island", islandResponse, { event, islandContext });
  return islandResponse;
});
async function getIslandContext(event) {
  let url = event.path || "";
  const componentParts = url.substring("/__nuxt_island".length + 1).replace(ISLAND_SUFFIX_RE, "").split("_");
  const hashId = componentParts.length > 1 ? componentParts.pop() : void 0;
  const componentName = componentParts.join("_");
  const context = event.method === "GET" ? getQuery$1(event) : await readBody(event);
  const ctx = {
    url: "/",
    ...context,
    id: hashId,
    name: componentName,
    props: destr$1(context.props) || {},
    slots: {},
    components: {}
  };
  return ctx;
}

const _lazy_jNHpjd = () => Promise.resolve().then(function () { return forgotPassword_post$1; });
const _lazy_MyKlQu = () => Promise.resolve().then(function () { return login_post$1; });
const _lazy_wD64rD = () => Promise.resolve().then(function () { return register_post$1; });
const _lazy_2vhMo2 = () => Promise.resolve().then(function () { return resetPassword_post$1; });
const _lazy_FQxnpl = () => Promise.resolve().then(function () { return processos_delete$1; });
const _lazy_LHV_bL = () => Promise.resolve().then(function () { return stats_get$1; });
const _lazy_Ht9XLv = () => Promise.resolve().then(function () { return itens_get$1; });
const _lazy_5TbrLG = () => Promise.resolve().then(function () { return _id__delete$1; });
const _lazy_CzQc1e = () => Promise.resolve().then(function () { return _id__put$1; });
const _lazy_2C8_wH = () => Promise.resolve().then(function () { return _processoId__delete$1; });
const _lazy_1PdPm1 = () => Promise.resolve().then(function () { return _processoId__put$3; });
const _lazy_8pA3RW = () => Promise.resolve().then(function () { return actions_post$1; });
const _lazy_qhbDcx = () => Promise.resolve().then(function () { return index_get$7; });
const _lazy_z95cTO = () => Promise.resolve().then(function () { return _processoId__put$1; });
const _lazy_Q81yjV = () => Promise.resolve().then(function () { return concluir_post$1; });
const _lazy_dz98Qk = () => Promise.resolve().then(function () { return index_delete$1; });
const _lazy_CF80Sv = () => Promise.resolve().then(function () { return iniciar_post$1; });
const _lazy_lRS9tw = () => Promise.resolve().then(function () { return pausar_post$1; });
const _lazy_Ti6QWP = () => Promise.resolve().then(function () { return index_get$5; });
const _lazy_HdjEyo = () => Promise.resolve().then(function () { return index_post$3; });
const _lazy_QaMZQF = () => Promise.resolve().then(function () { return template_post$1; });
const _lazy_VPkvMQ = () => Promise.resolve().then(function () { return index_get$3; });
const _lazy_zKWFxN = () => Promise.resolve().then(function () { return index_post$1; });
const _lazy_qyGLAc = () => Promise.resolve().then(function () { return recent_get$1; });
const _lazy_5EnahH = () => Promise.resolve().then(function () { return salvar_post$1; });
const _lazy_1uUSXj = () => Promise.resolve().then(function () { return index_get$1; });
const _lazy__qQdIa = () => Promise.resolve().then(function () { return modules_get$1; });
const _lazy_0XwxzV = () => Promise.resolve().then(function () { return renderer$1; });

const handlers = [
  { route: '', handler: _oStzCE, lazy: false, middleware: true, method: undefined },
  { route: '/api/auth/forgot-password', handler: _lazy_jNHpjd, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/login', handler: _lazy_MyKlQu, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/register', handler: _lazy_wD64rD, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/reset-password', handler: _lazy_2vhMo2, lazy: true, middleware: false, method: "post" },
  { route: '/api/clean/processos', handler: _lazy_FQxnpl, lazy: true, middleware: false, method: "delete" },
  { route: '/api/dashboard/stats', handler: _lazy_LHV_bL, lazy: true, middleware: false, method: "get" },
  { route: '/api/itens', handler: _lazy_Ht9XLv, lazy: true, middleware: false, method: "get" },
  { route: '/api/ops/:id', handler: _lazy_5TbrLG, lazy: true, middleware: false, method: "delete" },
  { route: '/api/ops/:id', handler: _lazy_CzQc1e, lazy: true, middleware: false, method: "put" },
  { route: '/api/ops/:id/:processoId', handler: _lazy_2C8_wH, lazy: true, middleware: false, method: "delete" },
  { route: '/api/ops/:id/:processoId', handler: _lazy_1PdPm1, lazy: true, middleware: false, method: "put" },
  { route: '/api/ops/:id/actions', handler: _lazy_8pA3RW, lazy: true, middleware: false, method: "post" },
  { route: '/api/ops/:id', handler: _lazy_qhbDcx, lazy: true, middleware: false, method: "get" },
  { route: '/api/ops/:id/processos/:processoId', handler: _lazy_z95cTO, lazy: true, middleware: false, method: "put" },
  { route: '/api/ops/:id/processos/:processoId/concluir', handler: _lazy_Q81yjV, lazy: true, middleware: false, method: "post" },
  { route: '/api/ops/:id/processos/:processoId', handler: _lazy_dz98Qk, lazy: true, middleware: false, method: "delete" },
  { route: '/api/ops/:id/processos/:processoId/iniciar', handler: _lazy_CF80Sv, lazy: true, middleware: false, method: "post" },
  { route: '/api/ops/:id/processos/:processoId/pausar', handler: _lazy_lRS9tw, lazy: true, middleware: false, method: "post" },
  { route: '/api/ops/:id/processos', handler: _lazy_Ti6QWP, lazy: true, middleware: false, method: "get" },
  { route: '/api/ops/:id/processos', handler: _lazy_HdjEyo, lazy: true, middleware: false, method: "post" },
  { route: '/api/ops/:id/processos/template', handler: _lazy_QaMZQF, lazy: true, middleware: false, method: "post" },
  { route: '/api/ops', handler: _lazy_VPkvMQ, lazy: true, middleware: false, method: "get" },
  { route: '/api/ops', handler: _lazy_zKWFxN, lazy: true, middleware: false, method: "post" },
  { route: '/api/ops/recent', handler: _lazy_qyGLAc, lazy: true, middleware: false, method: "get" },
  { route: '/api/salvar', handler: _lazy_5EnahH, lazy: true, middleware: false, method: "post" },
  { route: '/api/user', handler: _lazy_1uUSXj, lazy: true, middleware: false, method: "get" },
  { route: '/api/user/modules', handler: _lazy__qQdIa, lazy: true, middleware: false, method: "get" },
  { route: '/__nuxt_error', handler: _lazy_0XwxzV, lazy: true, middleware: false, method: undefined },
  { route: '/__nuxt_island/**', handler: _SxA8c9, lazy: false, middleware: false, method: undefined },
  { route: '/**', handler: _lazy_0XwxzV, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((error_) => {
      console.error("Error while capturing another error", error_);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(true),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const fetchContext = event.node.req?.__unenv__;
      if (fetchContext?._platform) {
        event.context = {
          _platform: fetchContext?._platform,
          // #3335
          ...fetchContext._platform,
          ...event.context
        };
      }
      if (!event.context.waitUntil && fetchContext?.waitUntil) {
        event.context.waitUntil = fetchContext.waitUntil;
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (event.context.waitUntil) {
          event.context.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
      await nitroApp$1.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter$1({
    preemptive: true
  });
  const nodeHandler = toNodeListener(h3App);
  const localCall = (aRequest) => callNodeRequestHandler(
    nodeHandler,
    aRequest
  );
  const localFetch = (input, init) => {
    if (!input.toString().startsWith("/")) {
      return globalThis.fetch(input, init);
    }
    return fetchNodeRequestHandler(
      nodeHandler,
      input,
      init
    ).then((response) => normalizeFetchResponse(response));
  };
  const $fetch = createFetch({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  return app;
}
function runNitroPlugins(nitroApp2) {
  for (const plugin of plugins) {
    try {
      plugin(nitroApp2);
    } catch (error) {
      nitroApp2.captureError(error, { tags: ["plugin"] });
      throw error;
    }
  }
}
const nitroApp$1 = createNitroApp();
function useNitroApp() {
  return nitroApp$1;
}
runNitroPlugins(nitroApp$1);

function defineRenderHandler(render) {
  const runtimeConfig = useRuntimeConfig();
  return eventHandler(async (event) => {
    const nitroApp = useNitroApp();
    const ctx = { event, render, response: void 0 };
    await nitroApp.hooks.callHook("render:before", ctx);
    if (!ctx.response) {
      if (event.path === `${runtimeConfig.app.baseURL}favicon.ico`) {
        setResponseHeader(event, "Content-Type", "image/x-icon");
        return send(
          event,
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        );
      }
      ctx.response = await ctx.render(event);
      if (!ctx.response) {
        const _currentStatus = getResponseStatus(event);
        setResponseStatus(event, _currentStatus === 200 ? 500 : _currentStatus);
        return send(
          event,
          "No response returned from render handler: " + event.path
        );
      }
    }
    await nitroApp.hooks.callHook("render:response", ctx.response, ctx);
    if (ctx.response.headers) {
      setResponseHeaders(event, ctx.response.headers);
    }
    if (ctx.response.statusCode || ctx.response.statusMessage) {
      setResponseStatus(
        event,
        ctx.response.statusCode,
        ctx.response.statusMessage
      );
    }
    return ctx.response.body;
  });
}

const scheduledTasks = false;

const tasks = {
  
};

const __runningTasks__ = {};
async function runTask(name, {
  payload = {},
  context = {}
} = {}) {
  if (__runningTasks__[name]) {
    return __runningTasks__[name];
  }
  if (!(name in tasks)) {
    throw createError({
      message: `Task \`${name}\` is not available!`,
      statusCode: 404
    });
  }
  if (!tasks[name].resolve) {
    throw createError({
      message: `Task \`${name}\` is not implemented!`,
      statusCode: 501
    });
  }
  const handler = await tasks[name].resolve();
  const taskEvent = { name, payload, context };
  __runningTasks__[name] = handler.run(taskEvent);
  try {
    const res = await __runningTasks__[name];
    return res;
  } finally {
    delete __runningTasks__[name];
  }
}

if (!globalThis.crypto) {
  globalThis.crypto = nodeCrypto;
}
const { NITRO_NO_UNIX_SOCKET, NITRO_DEV_WORKER_ID } = process.env;
trapUnhandledNodeErrors();
parentPort?.on("message", (msg) => {
  if (msg && msg.event === "shutdown") {
    shutdown();
  }
});
const nitroApp = useNitroApp();
const server$2 = new Server(toNodeListener(nitroApp.h3App));
let listener;
listen().catch(() => listen(
  true
  /* use random port */
)).catch((error) => {
  console.error("Dev worker failed to listen:", error);
  return shutdown();
});
nitroApp.router.get(
  "/_nitro/tasks",
  defineEventHandler(async (event) => {
    const _tasks = await Promise.all(
      Object.entries(tasks).map(async ([name, task]) => {
        const _task = await task.resolve?.();
        return [name, { description: _task?.meta?.description }];
      })
    );
    return {
      tasks: Object.fromEntries(_tasks),
      scheduledTasks
    };
  })
);
nitroApp.router.use(
  "/_nitro/tasks/:name",
  defineEventHandler(async (event) => {
    const name = getRouterParam(event, "name");
    const payload = {
      ...getQuery$1(event),
      ...await readBody(event).then((r) => r?.payload).catch(() => ({}))
    };
    return await runTask(name, { payload });
  })
);
function listen(useRandomPort = Boolean(
  NITRO_NO_UNIX_SOCKET || process.versions.webcontainer || "Bun" in globalThis && process.platform === "win32"
)) {
  return new Promise((resolve, reject) => {
    try {
      listener = server$2.listen(useRandomPort ? 0 : getSocketAddress(), () => {
        const address = server$2.address();
        parentPort?.postMessage({
          event: "listen",
          address: typeof address === "string" ? { socketPath: address } : { host: "localhost", port: address?.port }
        });
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}
function getSocketAddress() {
  const socketName = `nitro-worker-${process.pid}-${threadId}-${NITRO_DEV_WORKER_ID}-${Math.round(Math.random() * 1e4)}.sock`;
  if (process.platform === "win32") {
    return join(String.raw`\\.\pipe`, socketName);
  }
  if (process.platform === "linux") {
    const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
    if (nodeMajor >= 20) {
      return `\0${socketName}`;
    }
  }
  return join(tmpdir(), socketName);
}
async function shutdown() {
  server$2.closeAllConnections?.();
  await Promise.all([
    new Promise((resolve) => listener?.close(resolve)),
    nitroApp.hooks.callHook("close").catch(console.error)
  ]);
  parentPort?.postMessage({ event: "exit" });
}

const _messages = { "appName": "Nuxt", "version": "", "statusCode": 500, "statusMessage": "Server error", "description": "This page is temporarily unavailable." };
const template$1 = (messages) => {
  messages = { ..._messages, ...messages };
  return '<!DOCTYPE html><html lang="en"><head><title>' + escapeHtml(messages.statusCode) + " - " + escapeHtml(messages.statusMessage) + " | " + escapeHtml(messages.appName) + `</title><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,minimum-scale=1.0" name="viewport"><style>.spotlight{background:linear-gradient(45deg,#00dc82,#36e4da 50%,#0047e1);filter:blur(20vh)}*,:after,:before{border-color:var(--un-default-border-color,#e5e7eb);border-style:solid;border-width:0;box-sizing:border-box}:after,:before{--un-content:""}html{line-height:1.5;-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;font-feature-settings:normal;font-variation-settings:normal;-moz-tab-size:4;tab-size:4;-webkit-tap-highlight-color:transparent}body{line-height:inherit;margin:0}h1{font-size:inherit;font-weight:inherit}h1,p{margin:0}*,:after,:before{--un-rotate:0;--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-scale-x:1;--un-scale-y:1;--un-scale-z:1;--un-skew-x:0;--un-skew-y:0;--un-translate-x:0;--un-translate-y:0;--un-translate-z:0;--un-pan-x: ;--un-pan-y: ;--un-pinch-zoom: ;--un-scroll-snap-strictness:proximity;--un-ordinal: ;--un-slashed-zero: ;--un-numeric-figure: ;--un-numeric-spacing: ;--un-numeric-fraction: ;--un-border-spacing-x:0;--un-border-spacing-y:0;--un-ring-offset-shadow:0 0 transparent;--un-ring-shadow:0 0 transparent;--un-shadow-inset: ;--un-shadow:0 0 transparent;--un-ring-inset: ;--un-ring-offset-width:0px;--un-ring-offset-color:#fff;--un-ring-width:0px;--un-ring-color:rgba(147,197,253,.5);--un-blur: ;--un-brightness: ;--un-contrast: ;--un-drop-shadow: ;--un-grayscale: ;--un-hue-rotate: ;--un-invert: ;--un-saturate: ;--un-sepia: ;--un-backdrop-blur: ;--un-backdrop-brightness: ;--un-backdrop-contrast: ;--un-backdrop-grayscale: ;--un-backdrop-hue-rotate: ;--un-backdrop-invert: ;--un-backdrop-opacity: ;--un-backdrop-saturate: ;--un-backdrop-sepia: }.fixed{position:fixed}.-bottom-1\\/2{bottom:-50%}.left-0{left:0}.right-0{right:0}.grid{display:grid}.mb-16{margin-bottom:4rem}.mb-8{margin-bottom:2rem}.h-1\\/2{height:50%}.max-w-520px{max-width:520px}.min-h-screen{min-height:100vh}.place-content-center{place-content:center}.overflow-hidden{overflow:hidden}.bg-white{--un-bg-opacity:1;background-color:rgb(255 255 255/var(--un-bg-opacity))}.px-8{padding-left:2rem;padding-right:2rem}.text-center{text-align:center}.text-8xl{font-size:6rem;line-height:1}.text-xl{font-size:1.25rem;line-height:1.75rem}.text-black{--un-text-opacity:1;color:rgb(0 0 0/var(--un-text-opacity))}.font-light{font-weight:300}.font-medium{font-weight:500}.leading-tight{line-height:1.25}.font-sans{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}@media(prefers-color-scheme:dark){.dark\\:bg-black{--un-bg-opacity:1;background-color:rgb(0 0 0/var(--un-bg-opacity))}.dark\\:text-white{--un-text-opacity:1;color:rgb(255 255 255/var(--un-text-opacity))}}@media(min-width:640px){.sm\\:px-0{padding-left:0;padding-right:0}.sm\\:text-4xl{font-size:2.25rem;line-height:2.5rem}}</style><script>!function(){const e=document.createElement("link").relList;if(!(e&&e.supports&&e.supports("modulepreload"))){for(const e of document.querySelectorAll('link[rel="modulepreload"]'))r(e);new MutationObserver((e=>{for(const o of e)if("childList"===o.type)for(const e of o.addedNodes)"LINK"===e.tagName&&"modulepreload"===e.rel&&r(e)})).observe(document,{childList:!0,subtree:!0})}function r(e){if(e.ep)return;e.ep=!0;const r=function(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),"use-credentials"===e.crossOrigin?r.credentials="include":"anonymous"===e.crossOrigin?r.credentials="omit":r.credentials="same-origin",r}(e);fetch(e.href,r)}}();<\/script></head><body class="antialiased bg-white dark:bg-black dark:text-white font-sans grid min-h-screen overflow-hidden place-content-center text-black"><div class="-bottom-1/2 fixed h-1/2 left-0 right-0 spotlight"></div><div class="max-w-520px text-center"><h1 class="font-medium mb-8 sm:text-10xl text-8xl">` + escapeHtml(messages.statusCode) + '</h1><p class="font-light leading-tight mb-16 px-8 sm:px-0 sm:text-4xl text-xl">' + escapeHtml(messages.description) + "</p></div></body></html>";
};

const error500 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  template: template$1
}, Symbol.toStringTag, { value: 'Module' }));

const server = () => {};

const server$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: server
}, Symbol.toStringTag, { value: 'Module' }));

const template = "";

const _virtual__spaTemplate = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  template: template
}, Symbol.toStringTag, { value: 'Module' }));

const styles = {};

const styles$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: styles
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$n = new PrismaClient();
const forgotPassword_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    const user = await prisma$n.user.findUnique({
      where: {
        email: body.email
      }
    });
    if (!user) {
      return {
        success: true,
        message: "Se o e-mail existir em nosso sistema, voc\xEA receber\xE1 um link de recupera\xE7\xE3o"
      };
    }
    const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const resetTokenExpiry = new Date(Date.now() + 36e5);
    await prisma$n.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });
    const transporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Redefini\xE7\xE3o de Senha - Sistema SOMEH",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1867C0;">Redefini\xE7\xE3o de Senha</h2>
          <p>Ol\xE1 ${user.name},</p>
          <p>Voc\xEA solicitou a redefini\xE7\xE3o de sua senha. Clique no link abaixo para criar uma nova senha:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #1867C0; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Redefinir Senha
            </a>
          </p>
          <p>Este link expirar\xE1 em 1 hora.</p>
          <p>Se voc\xEA n\xE3o solicitou esta redefini\xE7\xE3o, ignore este e-mail.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Sistema SOMEH - Controle de Produ\xE7\xE3o
          </p>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
    return {
      success: true,
      message: "Link de recupera\xE7\xE3o enviado para seu e-mail"
    };
  } catch (error) {
    console.error("Erro no forgot-password:", error);
    return {
      success: false,
      message: "Erro ao processar solicita\xE7\xE3o"
    };
  }
});

const forgotPassword_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: forgotPassword_post
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$m = new PrismaClient();
const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const login_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  console.log("\u{1F510} Tentativa de login:", body.email);
  try {
    const user = await prisma$m.user.findUnique({
      where: {
        email: body.email
      }
    });
    if (!user) {
      console.log("\u274C Usu\xE1rio n\xE3o encontrado:", body.email);
      throw createError({
        statusCode: 401,
        statusMessage: "Credenciais inv\xE1lidas"
      });
    }
    console.log("\u{1F464} Usu\xE1rio encontrado:", user.email, "ID:", user.id);
    if (!user.isActive) {
      console.log("\u274C Usu\xE1rio desativado:", user.email);
      throw createError({
        statusCode: 401,
        statusMessage: "Usu\xE1rio desativado"
      });
    }
    const validPassword = await bcrypt.compare(body.password, user.password);
    console.log("\u{1F511} Valida\xE7\xE3o de senha:", validPassword ? "\u2705 Correta" : "\u274C Incorreta");
    if (!validPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: "Credenciais inv\xE1lidas"
      });
    }
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        department: user.department
      },
      jwtSecret,
      { expiresIn: "24h" }
    );
    console.log("\u2705 Login bem-sucedido:", user.email);
    return {
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    };
  } catch (error) {
    console.error("\u274C Erro no login:", error.message);
    if (error.statusCode === 401) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Erro ao fazer login: ${error.message}`
    });
  }
});

const login_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: login_post
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$l = new PrismaClient();
const register_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  console.log("\u{1F4DD} Tentativa de registro:", {
    email: body.email,
    name: body.name,
    department: body.department,
    role: body.role
  });
  try {
    const existingUser = await prisma$l.user.findUnique({
      where: {
        email: body.email
      }
    });
    if (existingUser) {
      console.log("\u274C Usu\xE1rio j\xE1 existe:", body.email);
      throw createError({
        statusCode: 400,
        statusMessage: "Usu\xE1rio j\xE1 existe"
      });
    }
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = await prisma$l.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        department: body.department || "ADMINISTRATIVO",
        role: body.role || "USER"
      }
    });
    console.log("\u2705 Usu\xE1rio criado com sucesso:", user.id, user.email);
    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    };
  } catch (error) {
    console.error("\u274C Erro ao criar usu\xE1rio:", error);
    if (error.code === "P2002") {
      throw createError({
        statusCode: 400,
        statusMessage: "E-mail j\xE1 cadastrado"
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Erro ao criar usu\xE1rio: ${error.message}`
    });
  }
});

const register_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: register_post
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$k = new PrismaClient();
const resetPassword_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    const user = await prisma$k.user.findFirst({
      where: {
        resetToken: body.token,
        resetTokenExpiry: {
          gt: /* @__PURE__ */ new Date()
          // Token ainda não expirou
        }
      }
    });
    if (!user) {
      return {
        success: false,
        message: "Token inv\xE1lido ou expirado"
      };
    }
    const hashedPassword = await bcrypt.hash(body.password, 10);
    await prisma$k.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
    return {
      success: true,
      message: "Senha redefinida com sucesso"
    };
  } catch (error) {
    console.error("Erro no reset-password:", error);
    return {
      success: false,
      message: "Erro ao redefinir senha"
    };
  }
});

const resetPassword_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: resetPassword_post
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$j = new PrismaClient();
const processos_delete = defineEventHandler(async (event) => {
  try {
    const result = await prisma$j.oPProcesso.deleteMany({});
    return {
      success: true,
      message: `Foram exclu\xEDdos ${result.count} processos`
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Erro ao limpar processos"
    });
  }
});

const processos_delete$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: processos_delete
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$i = new PrismaClient();
const stats_get = defineEventHandler(async (event) => {
  try {
    const opsAbertas = await prisma$i.oP.count({
      where: { status: "ABERTA" }
    });
    const opsProducao = await prisma$i.oP.count({
      where: {
        status: {
          in: ["EM_PROJETO", "EM_FABRICACAO", "EM_MONTAGEM"]
        }
      }
    });
    const opsConcluidas = await prisma$i.oP.count({
      where: { status: "ENTREGUE" }
    });
    const opsAtrasadas = await prisma$i.oP.count({
      where: {
        dataEntrega: { lt: /* @__PURE__ */ new Date() },
        status: { not: "ENTREGUE" }
      }
    });
    return {
      opsAbertas,
      opsProducao,
      opsConcluidas,
      opsAtrasadas
    };
  } catch (error) {
    console.error("Erro ao carregar estat\xEDsticas:", error);
    return {
      opsAbertas: 0,
      opsProducao: 0,
      opsConcluidas: 0,
      opsAtrasadas: 0
    };
  }
});

const stats_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: stats_get
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$h = new PrismaClient();
const itens_get = defineEventHandler(async (event) => {
  try {
    const itens = await prisma$h.item.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });
    return itens || [];
  } catch (error) {
    console.error("Erro ao buscar itens:", error);
    return [];
  }
});

const itens_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: itens_get
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$g = new PrismaClient();
const _id__delete = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID da OP n\xE3o informado"
      });
    }
    const existingOP = await prisma$g.oP.findUnique({
      where: { id: parseInt(id) }
    });
    if (!existingOP) {
      throw createError({
        statusCode: 404,
        statusMessage: "OP n\xE3o encontrada"
      });
    }
    await prisma$g.oP.delete({
      where: { id: parseInt(id) }
    });
    await prisma$g.oPHistorico.create({
      data: {
        opId: parseInt(id),
        usuarioId: 1,
        // Em produção, pegar do usuário logado
        acao: "OP exclu\xEDda",
        detalhes: `Ordem de produ\xE7\xE3o ${existingOP.numeroOP} exclu\xEDda`
      }
    });
    return { success: true, message: "OP exclu\xEDda com sucesso" };
  } catch (error) {
    console.error("Erro ao excluir OP:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Erro ao excluir ordem de produ\xE7\xE3o"
    });
  }
});

const _id__delete$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__delete
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$f = new PrismaClient();
const _id__put = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID da OP n\xE3o informado"
      });
    }
    const existingOP = await prisma$f.oP.findUnique({
      where: { id: parseInt(id) }
    });
    if (!existingOP) {
      throw createError({
        statusCode: 404,
        statusMessage: "OP n\xE3o encontrada"
      });
    }
    const op = await prisma$f.oP.update({
      where: { id: parseInt(id) },
      data: {
        numeroOP: body.numeroOP,
        codigoMaquina: body.codigoMaquina,
        descricaoMaquina: body.descricaoMaquina,
        dataPedido: new Date(body.dataPedido),
        dataEntrega: new Date(body.dataEntrega),
        cliente: body.cliente,
        cnpjCliente: body.cnpjCliente,
        enderecoCliente: body.enderecoCliente,
        observacoes: body.observacoes,
        status: body.status,
        responsavelId: body.responsavelId || null
      },
      include: {
        responsavel: {
          select: { name: true }
        }
      }
    });
    await prisma$f.oPHistorico.create({
      data: {
        opId: op.id,
        usuarioId: 1,
        // Em produção, pegar do usuário logado
        acao: "OP atualizada",
        detalhes: `Ordem de produ\xE7\xE3o ${body.numeroOP} atualizada`
      }
    });
    return { success: true, op };
  } catch (error) {
    console.error("Erro ao atualizar OP:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Erro ao atualizar ordem de produ\xE7\xE3o"
    });
  }
});

const _id__put$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__put
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$e = new PrismaClient();
const _processoId__delete = defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, "id");
    const processoId = getRouterParam(event, "processoId");
    if (!opId || !processoId) {
      throw createError({
        statusCode: 400,
        statusMessage: "IDs n\xE3o informados"
      });
    }
    const existingProcesso = await prisma$e.oPProcesso.findFirst({
      where: {
        id: parseInt(processoId),
        opId: parseInt(opId)
      }
    });
    if (!existingProcesso) {
      throw createError({
        statusCode: 404,
        statusMessage: "Processo n\xE3o encontrado"
      });
    }
    await prisma$e.processoHistorico.deleteMany({
      where: {
        processoId: parseInt(processoId)
      }
    });
    await prisma$e.oPProcesso.delete({
      where: {
        id: parseInt(processoId)
      }
    });
    return { success: true, message: "Processo exclu\xEDdo com sucesso" };
  } catch (error) {
    console.error("Erro ao excluir processo:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Erro ao excluir processo"
    });
  }
});

const _processoId__delete$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _processoId__delete
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$d = new PrismaClient();
const _processoId__put$2 = defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, "id");
    const processoId = getRouterParam(event, "processoId");
    const body = await readBody(event);
    if (!opId || !processoId) {
      throw createError({
        statusCode: 400,
        statusMessage: "IDs n\xE3o informados"
      });
    }
    const existingProcesso = await prisma$d.oPProcesso.findFirst({
      where: {
        id: parseInt(processoId),
        opId: parseInt(opId)
      }
    });
    if (!existingProcesso) {
      throw createError({
        statusCode: 404,
        statusMessage: "Processo n\xE3o encontrado"
      });
    }
    const processo = await prisma$d.oPProcesso.update({
      where: {
        id: parseInt(processoId)
      },
      data: {
        nome: body.nome,
        descricao: body.descricao,
        sequencia: body.sequencia,
        status: body.status,
        progresso: body.progresso,
        prazoEstimado: body.prazoEstimado,
        dataPrevista: body.dataPrevista ? new Date(body.dataPrevista) : null,
        responsavelId: body.responsavelId
      },
      include: {
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    await prisma$d.processoHistorico.create({
      data: {
        processoId: processo.id,
        usuarioId: 1,
        // Em produção, pegar do usuário logado
        acao: "Processo atualizado",
        detalhes: `Processo "${body.nome}" atualizado`
      }
    });
    return { success: true, processo };
  } catch (error) {
    console.error("Erro ao atualizar processo:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Erro ao atualizar processo"
    });
  }
});

const _processoId__put$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _processoId__put$2
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$c = new PrismaClient();
const actions_post = defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, "id");
    const processoId = getRouterParam(event, "processoId");
    const body = await readBody(event);
    if (!opId || !processoId || !body.acao) {
      throw createError({
        statusCode: 400,
        statusMessage: "Dados incompletos"
      });
    }
    const existingProcesso = await prisma$c.oPProcesso.findFirst({
      where: {
        id: parseInt(processoId),
        opId: parseInt(opId)
      }
    });
    if (!existingProcesso) {
      throw createError({
        statusCode: 404,
        statusMessage: "Processo n\xE3o encontrado"
      });
    }
    let updateData = {};
    let acaoHistorico = "";
    let detalhesHistorico = "";
    switch (body.acao) {
      case "INICIAR":
        updateData = {
          status: "EM_ANDAMENTO",
          dataInicio: /* @__PURE__ */ new Date(),
          progresso: 10
        };
        acaoHistorico = "Processo iniciado";
        detalhesHistorico = `Processo "${existingProcesso.nome}" iniciado`;
        break;
      case "PAUSAR":
        updateData = {
          status: "AGUARDANDO"
        };
        acaoHistorico = "Processo pausado";
        detalhesHistorico = `Processo "${existingProcesso.nome}" pausado`;
        break;
      case "CONCLUIR":
        updateData = {
          status: "CONCLUIDO",
          progresso: 100,
          dataFim: /* @__PURE__ */ new Date()
        };
        acaoHistorico = "Processo conclu\xEDdo";
        detalhesHistorico = `Processo "${existingProcesso.nome}" conclu\xEDdo`;
        break;
      case "REABRIR":
        updateData = {
          status: "EM_ANDAMENTO",
          dataFim: null
        };
        acaoHistorico = "Processo reaberto";
        detalhesHistorico = `Processo "${existingProcesso.nome}" reaberto`;
        break;
      default:
        throw createError({
          statusCode: 400,
          statusMessage: "A\xE7\xE3o n\xE3o reconhecida"
        });
    }
    const processo = await prisma$c.oPProcesso.update({
      where: {
        id: parseInt(processoId)
      },
      data: updateData,
      include: {
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    await prisma$c.processoHistorico.create({
      data: {
        processoId: processo.id,
        usuarioId: 1,
        // Em produção, pegar do usuário logado
        acao: acaoHistorico,
        detalhes: detalhesHistorico
      }
    });
    return { success: true, processo };
  } catch (error) {
    console.error("Erro na a\xE7\xE3o do processo:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Erro na a\xE7\xE3o do processo"
    });
  }
});

const actions_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: actions_post
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$b = new PrismaClient();
const index_get$6 = defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, "id");
    if (!opId) {
      throw createError({
        statusCode: 400,
        message: "ID da OP n\xE3o informado"
      });
    }
    const op = await prisma$b.oP.findUnique({
      where: {
        id: parseInt(opId)
      },
      include: {
        criadoPor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    if (!op) {
      throw createError({
        statusCode: 404,
        message: "OP n\xE3o encontrada"
      });
    }
    return op;
  } catch (error) {
    console.error("Erro ao carregar OP:", error);
    throw createError({
      statusCode: 500,
      message: "Erro interno do servidor"
    });
  }
});

const index_get$7 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$6
}, Symbol.toStringTag, { value: 'Module' }));

const _processoId__put = defineEventHandler(async (event) => {
  var _a, _b;
  try {
    const opId = getRouterParam(event, "id");
    const processoId = getRouterParam(event, "processoId");
    const body = await readBody(event);
    console.log("\u270F\uFE0F DEBUG - Editando processo:", { opId, processoId, body });
    if (!opId || !processoId) {
      throw createError({
        statusCode: 400,
        statusMessage: "IDs n\xE3o informados"
      });
    }
    const prisma = event.context.prisma;
    const existingProcesso = await prisma.oPProcesso.findFirst({
      where: {
        id: parseInt(processoId),
        opId: parseInt(opId)
      }
    });
    if (!existingProcesso) {
      throw createError({
        statusCode: 404,
        statusMessage: "Processo n\xE3o encontrado"
      });
    }
    if (body.sequencia !== void 0) {
      const novaSequencia = parseInt(body.sequencia);
      const sequenciaExistente = await prisma.oPProcesso.findFirst({
        where: {
          opId: parseInt(opId),
          sequencia: novaSequencia,
          id: {
            not: parseInt(processoId)
          }
        }
      });
      if (sequenciaExistente) {
        throw createError({
          statusCode: 400,
          statusMessage: "J\xE1 existe um processo com esta sequ\xEAncia"
        });
      }
    }
    const updateData = {
      nome: ((_a = body.nome) == null ? void 0 : _a.trim()) || existingProcesso.nome,
      descricao: ((_b = body.descricao) == null ? void 0 : _b.trim()) || null,
      status: body.status || existingProcesso.status,
      responsavelId: body.responsavelId ? parseInt(body.responsavelId) : null
    };
    if (body.sequencia !== void 0) {
      updateData.sequencia = parseInt(body.sequencia);
    }
    if (body.progresso !== void 0) {
      updateData.progresso = parseInt(body.progresso);
    }
    if (body.prazoEstimado !== void 0) {
      updateData.prazoEstimado = body.prazoEstimado !== null ? parseInt(body.prazoEstimado) : null;
    }
    if (body.dataPrevista !== void 0) {
      if (body.dataPrevista === null || body.dataPrevista === "") {
        updateData.dataPrevista = null;
      } else {
        try {
          const dateStr = typeof body.dataPrevista === "string" && !body.dataPrevista.includes("T") ? body.dataPrevista + "T00:00:00.000Z" : body.dataPrevista;
          updateData.dataPrevista = new Date(dateStr);
        } catch (error) {
          console.warn("\u26A0\uFE0F Erro ao converter dataPrevista:", error);
        }
      }
    }
    if (body.dataInicioPrevista !== void 0) {
      if (body.dataInicioPrevista === null || body.dataInicioPrevista === "") {
        updateData.dataInicioPrevista = null;
      } else {
        try {
          const dateStr = typeof body.dataInicioPrevista === "string" && !body.dataInicioPrevista.includes("T") ? body.dataInicioPrevista + "T00:00:00.000Z" : body.dataInicioPrevista;
          updateData.dataInicioPrevista = new Date(dateStr);
        } catch (error) {
          console.warn("\u26A0\uFE0F Erro ao converter dataInicioPrevista:", error);
        }
      }
    }
    if (body.dataTerminoPrevista !== void 0) {
      if (body.dataTerminoPrevista === null || body.dataTerminoPrevista === "") {
        updateData.dataTerminoPrevista = null;
      } else {
        try {
          const dateStr = typeof body.dataTerminoPrevista === "string" && !body.dataTerminoPrevista.includes("T") ? body.dataTerminoPrevista + "T00:00:00.000Z" : body.dataTerminoPrevista;
          updateData.dataTerminoPrevista = new Date(dateStr);
        } catch (error) {
          console.warn("\u26A0\uFE0F Erro ao converter dataTerminoPrevista:", error);
        }
      }
    }
    if (body.dataInicio !== void 0) {
      if (body.dataInicio === null || body.dataInicio === "") {
        updateData.dataInicio = null;
      } else {
        try {
          const dateStr = typeof body.dataInicio === "string" && !body.dataInicio.includes("T") ? body.dataInicio + "T00:00:00.000Z" : body.dataInicio;
          updateData.dataInicio = new Date(dateStr);
        } catch (error) {
          console.warn("\u26A0\uFE0F Erro ao converter dataInicio:", error);
        }
      }
    }
    if (body.dataFim !== void 0) {
      if (body.dataFim === null || body.dataFim === "") {
        updateData.dataFim = null;
      } else {
        try {
          const dateStr = typeof body.dataFim === "string" && !body.dataFim.includes("T") ? body.dataFim + "T00:00:00.000Z" : body.dataFim;
          updateData.dataFim = new Date(dateStr);
        } catch (error) {
          console.warn("\u26A0\uFE0F Erro ao converter dataFim:", error);
        }
      }
    }
    console.log("\u{1F4DD} DEBUG - Dados para atualiza\xE7\xE3o:", updateData);
    const processo = await prisma.oPProcesso.update({
      where: {
        id: parseInt(processoId)
      },
      data: updateData,
      include: {
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        op: {
          select: {
            id: true,
            numeroOP: true,
            descricaoMaquina: true,
            dataInicio: true
          }
        }
      }
    });
    try {
      const processosOP = await prisma.oPProcesso.findMany({
        where: { opId: parseInt(opId) },
        select: { progresso: true }
      });
      if (processosOP.length > 0) {
        const progressoMedio = Math.round(
          processosOP.reduce((sum, p) => sum + p.progresso, 0) / processosOP.length
        );
        await prisma.oP.update({
          where: { id: parseInt(opId) },
          data: { progresso: progressoMedio }
        });
        console.log("\u{1F4CA} Progresso da OP atualizado para:", progressoMedio + "%");
      }
    } catch (progressError) {
      console.log("\u26A0\uFE0F N\xE3o foi poss\xEDvel atualizar progresso da OP:", progressError);
    }
    try {
      await prisma.processoHistorico.create({
        data: {
          processoId: processo.id,
          usuarioId: 1,
          // TODO: Substituir pelo ID do usuário logado
          acao: "Processo atualizado",
          detalhes: `Processo "${body.nome || existingProcesso.nome}" atualizado - Status: ${body.status || existingProcesso.status}`
        }
      });
      console.log("\u{1F4D6} Hist\xF3rico criado para processo:", processo.id);
    } catch (historyError) {
      console.log("\u2139\uFE0F Tabela de hist\xF3rico n\xE3o dispon\xEDvel, continuando...");
    }
    console.log("\u2705 Processo atualizado com sucesso:", {
      id: processo.id,
      nome: processo.nome,
      dataInicioPrevista: processo.dataInicioPrevista,
      dataTerminoPrevista: processo.dataTerminoPrevista
    });
    return {
      success: true,
      processo,
      message: "Processo atualizado com sucesso"
    };
  } catch (error) {
    console.error("\u274C Erro ao atualizar processo:", error);
    let errorMessage = error.message || "Erro ao atualizar processo";
    let statusCode = error.statusCode || 500;
    if (error.code === "P2025") {
      errorMessage = "Processo n\xE3o encontrado";
      statusCode = 404;
    } else if (error.code === "P2002") {
      errorMessage = "J\xE1 existe um processo com esta sequ\xEAncia";
      statusCode = 400;
    } else if (error.code === "P2003") {
      errorMessage = "Respons\xE1vel n\xE3o encontrado";
      statusCode = 400;
    }
    throw createError({
      statusCode,
      statusMessage: errorMessage
    });
  }
});

const _processoId__put$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _processoId__put
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$a = new PrismaClient();
const concluir_post = defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, "id");
    const processoId = getRouterParam(event, "processoId");
    if (!opId || !processoId) {
      throw createError({
        statusCode: 400,
        statusMessage: "IDs inv\xE1lidos"
      });
    }
    const existingProcesso = await prisma$a.oPProcesso.findFirst({
      where: {
        id: parseInt(processoId),
        opId: parseInt(opId)
      }
    });
    if (!existingProcesso) {
      throw createError({
        statusCode: 404,
        statusMessage: "Processo n\xE3o encontrado"
      });
    }
    const processo = await prisma$a.oPProcesso.update({
      where: {
        id: parseInt(processoId)
      },
      data: {
        status: "CONCLUIDO",
        progresso: 100,
        dataFim: /* @__PURE__ */ new Date()
      }
    });
    const processosOP = await prisma$a.oPProcesso.findMany({
      where: { opId: parseInt(opId) },
      select: { progresso: true }
    });
    const progressoMedio = processosOP.length > 0 ? Math.round(processosOP.reduce((sum, p) => sum + p.progresso, 0) / processosOP.length) : 0;
    await prisma$a.oP.update({
      where: { id: parseInt(opId) },
      data: { progresso: progressoMedio }
    });
    await prisma$a.processoHistorico.create({
      data: {
        processoId: processo.id,
        usuarioId: 1,
        // TODO: Pegar do usuário logado
        acao: "Processo conclu\xEDdo",
        detalhes: `Processo "${existingProcesso.nome}" conclu\xEDdo`
      }
    });
    return { success: true, processo };
  } catch (error) {
    console.error("Erro ao concluir processo:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Erro ao concluir processo"
    });
  }
});

const concluir_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: concluir_post
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$9 = new PrismaClient();
const index_delete = defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, "id");
    const processoId = getRouterParam(event, "processoId");
    console.log("\u{1F5D1}\uFE0F DEBUG - Excluindo processo:", { opId, processoId });
    if (!opId || !processoId) {
      throw createError({
        statusCode: 400,
        message: "ID da OP ou ID do processo n\xE3o informado"
      });
    }
    const processoExistente = await prisma$9.oPProcesso.findFirst({
      where: {
        id: parseInt(processoId),
        opId: parseInt(opId)
      },
      include: {
        historico: true
      }
    });
    if (!processoExistente) {
      throw createError({
        statusCode: 404,
        message: "Processo n\xE3o encontrado nesta OP"
      });
    }
    if (processoExistente.historico.length > 0) {
      await prisma$9.processoHistorico.deleteMany({
        where: {
          processoId: parseInt(processoId)
        }
      });
    }
    await prisma$9.oPProcesso.delete({
      where: {
        id: parseInt(processoId)
      }
    });
    console.log("\u2705 Processo exclu\xEDdo com sucesso");
    return { success: true, message: "Processo exclu\xEDdo com sucesso" };
  } catch (error) {
    console.error("Erro ao excluir processo:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Erro ao excluir processo"
    });
  }
});

const index_delete$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_delete
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$8 = new PrismaClient();
const iniciar_post = defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, "id");
    const processoId = getRouterParam(event, "processoId");
    if (!opId || !processoId) {
      throw createError({
        statusCode: 400,
        statusMessage: "IDs inv\xE1lidos"
      });
    }
    const existingProcesso = await prisma$8.oPProcesso.findFirst({
      where: {
        id: parseInt(processoId),
        opId: parseInt(opId)
      }
    });
    if (!existingProcesso) {
      throw createError({
        statusCode: 404,
        statusMessage: "Processo n\xE3o encontrado"
      });
    }
    const processo = await prisma$8.oPProcesso.update({
      where: {
        id: parseInt(processoId)
      },
      data: {
        status: "EM_ANDAMENTO",
        dataInicio: /* @__PURE__ */ new Date(),
        progresso: existingProcesso.progresso > 0 ? existingProcesso.progresso : 10
      }
    });
    await prisma$8.processoHistorico.create({
      data: {
        processoId: processo.id,
        usuarioId: 1,
        // TODO: Pegar do usuário logado
        acao: "Processo iniciado",
        detalhes: `Processo "${existingProcesso.nome}" iniciado`
      }
    });
    return { success: true, processo };
  } catch (error) {
    console.error("Erro ao iniciar processo:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Erro ao iniciar processo"
    });
  }
});

const iniciar_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: iniciar_post
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$7 = new PrismaClient();
const pausar_post = defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, "id");
    const processoId = getRouterParam(event, "processoId");
    if (!opId || !processoId) {
      throw createError({
        statusCode: 400,
        statusMessage: "IDs inv\xE1lidos"
      });
    }
    const existingProcesso = await prisma$7.oPProcesso.findFirst({
      where: {
        id: parseInt(processoId),
        opId: parseInt(opId)
      }
    });
    if (!existingProcesso) {
      throw createError({
        statusCode: 404,
        statusMessage: "Processo n\xE3o encontrado"
      });
    }
    const processo = await prisma$7.oPProcesso.update({
      where: {
        id: parseInt(processoId)
      },
      data: {
        status: "AGUARDANDO"
      }
    });
    await prisma$7.processoHistorico.create({
      data: {
        processoId: processo.id,
        usuarioId: 1,
        // TODO: Pegar do usuário logado
        acao: "Processo pausado",
        detalhes: `Processo "${existingProcesso.nome}" pausado`
      }
    });
    return { success: true, processo };
  } catch (error) {
    console.error("Erro ao pausar processo:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Erro ao pausar processo"
    });
  }
});

const pausar_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: pausar_post
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$6 = new PrismaClient();
const index_get$4 = defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, "id");
    console.log("\u{1F50D} API: Buscando processos para OP:", opId);
    if (!opId) {
      throw createError({
        statusCode: 400,
        message: "ID da OP n\xE3o informado"
      });
    }
    const processos = await prisma$6.oPProcesso.findMany({
      where: {
        opId: parseInt(opId)
      },
      include: {
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        sequencia: "asc"
      }
    });
    console.log("\u2705 API: Processos encontrados:", processos.length);
    return processos;
  } catch (error) {
    console.error("\u274C API: Erro ao carregar processos:", error);
    throw createError({
      statusCode: 500,
      message: "Erro interno do servidor"
    });
  }
});

const index_get$5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$4
}, Symbol.toStringTag, { value: 'Module' }));

const index_post$2 = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  try {
    const opId = getRouterParam(event, "id");
    const body = await readBody(event);
    console.log("\u{1F195} DEBUG - Criando processo:", { opId, body });
    if (!opId) {
      throw createError({
        statusCode: 400,
        message: "ID da OP n\xE3o informado"
      });
    }
    const prisma = event.context.prisma;
    const opExistente = await prisma.oP.findUnique({
      where: {
        id: parseInt(opId)
      }
    });
    if (!opExistente) {
      throw createError({
        statusCode: 404,
        message: "OP n\xE3o encontrada"
      });
    }
    const errors = [];
    if (!body.nome || body.nome.trim() === "") {
      errors.push("Nome \xE9 obrigat\xF3rio");
    }
    if (!body.sequencia) {
      errors.push("Sequ\xEAncia \xE9 obrigat\xF3ria");
    } else if (isNaN(parseInt(body.sequencia)) || parseInt(body.sequencia) <= 0) {
      errors.push("Sequ\xEAncia deve ser um n\xFAmero positivo");
    }
    if (!body.prazoEstimado) {
      errors.push("Prazo estimado \xE9 obrigat\xF3rio");
    } else if (isNaN(parseInt(body.prazoEstimado)) || parseInt(body.prazoEstimado) <= 0) {
      errors.push("Prazo estimado deve ser um n\xFAmero positivo");
    }
    if (errors.length > 0) {
      throw createError({
        statusCode: 400,
        message: errors.join(", ")
      });
    }
    const sequencia = parseInt(body.sequencia);
    const existingProcesso = await prisma.oPProcesso.findFirst({
      where: {
        opId: parseInt(opId),
        sequencia
      }
    });
    if (existingProcesso) {
      throw createError({
        statusCode: 400,
        message: "J\xE1 existe um processo com esta sequ\xEAncia"
      });
    }
    const parseDate = (dateValue) => {
      if (!dateValue || dateValue === "" || dateValue === null) {
        return null;
      }
      try {
        let dateStr = dateValue;
        if (typeof dateStr === "string" && !dateStr.includes("T")) {
          dateStr = dateStr + "T00:00:00.000Z";
        }
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          console.warn(`\u26A0\uFE0F Data inv\xE1lida: ${dateValue}`);
          return null;
        }
        return date;
      } catch (error) {
        console.warn(`\u26A0\uFE0F Erro ao converter data: ${dateValue}`, error);
        return null;
      }
    };
    const dataPrevista = parseDate(body.dataPrevista);
    const dataInicioPrevista = parseDate(body.dataInicioPrevista);
    const dataTerminoPrevista = parseDate(body.dataTerminoPrevista);
    const dataInicio = parseDate(body.dataInicio);
    const dataFim = parseDate(body.dataFim);
    let dataInicioCalculada = dataInicioPrevista;
    let dataTerminoCalculada = dataTerminoPrevista;
    if (!dataInicioCalculada) {
      if (dataPrevista) {
        dataInicioCalculada = dataPrevista;
      } else {
        dataInicioCalculada = opExistente.dataInicio || null;
      }
    }
    if (dataInicioCalculada && !dataTerminoCalculada && body.prazoEstimado) {
      const prazo = parseInt(body.prazoEstimado);
      if (prazo > 0) {
        const terminoDate = new Date(dataInicioCalculada);
        terminoDate.setDate(terminoDate.getDate() + prazo - 1);
        dataTerminoCalculada = terminoDate;
      }
    }
    const processoData = {
      opId: parseInt(opId),
      nome: body.nome.trim(),
      descricao: ((_a = body.descricao) == null ? void 0 : _a.trim()) || null,
      sequencia,
      status: body.status || "NAO_INICIADO",
      progresso: parseInt(body.progresso) || 0,
      prazoEstimado: body.prazoEstimado ? parseInt(body.prazoEstimado) : null,
      // ✅ DATAS PREVISTAS (CÁLCULO EM CASCATA)
      dataInicioPrevista: dataInicioCalculada,
      dataTerminoPrevista: dataTerminoCalculada,
      // ✅ DATAS REAIS (se fornecidas)
      dataInicio,
      dataFim,
      // ✅ DATAS DE COMPATIBILIDADE (campo antigo)
      dataPrevista: dataPrevista || dataInicioCalculada,
      responsavelId: body.responsavelId ? parseInt(body.responsavelId) : null
    };
    console.log("\u{1F4DD} DEBUG - Dados do processo a ser criado:", {
      ...processoData,
      dataInicioPrevista: (_b = processoData.dataInicioPrevista) == null ? void 0 : _b.toISOString(),
      dataTerminoPrevista: (_c = processoData.dataTerminoPrevista) == null ? void 0 : _c.toISOString(),
      dataPrevista: (_d = processoData.dataPrevista) == null ? void 0 : _d.toISOString()
    });
    const processo = await prisma.oPProcesso.create({
      data: processoData,
      include: {
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        op: {
          select: {
            id: true,
            numeroOP: true,
            descricaoMaquina: true,
            dataInicio: true
          }
        }
      }
    });
    const processosOP = await prisma.oPProcesso.findMany({
      where: { opId: parseInt(opId) },
      select: { progresso: true }
    });
    const progressoMedio = processosOP.length > 0 ? Math.round(processosOP.reduce((sum, p) => sum + p.progresso, 0) / processosOP.length) : 0;
    await prisma.oP.update({
      where: { id: parseInt(opId) },
      data: { progresso: progressoMedio }
    });
    console.log("\u{1F4CA} Progresso da OP atualizado para:", progressoMedio + "%");
    try {
      await prisma.processoHistorico.create({
        data: {
          processoId: processo.id,
          usuarioId: 1,
          // TODO: Substituir pelo ID do usuário logado
          acao: "Processo criado",
          detalhes: `Processo "${body.nome}" criado na OP ${opExistente.numeroOP}`
        }
      });
      console.log("\u{1F4D6} Hist\xF3rico criado para processo:", processo.id);
    } catch (historyError) {
      console.log("\u2139\uFE0F Tabela de hist\xF3rico n\xE3o dispon\xEDvel, continuando...");
    }
    console.log("\u2705 Processo criado com sucesso:", {
      id: processo.id,
      nome: processo.nome,
      dataInicioPrevista: (_e = processo.dataInicioPrevista) == null ? void 0 : _e.toISOString(),
      dataTerminoPrevista: (_f = processo.dataTerminoPrevista) == null ? void 0 : _f.toISOString()
    });
    return {
      success: true,
      processo,
      message: "Processo criado com sucesso"
    };
  } catch (error) {
    console.error("\u274C Erro ao criar processo:", error);
    let errorMessage = error.message || "Erro ao criar processo";
    let statusCode = error.statusCode || 500;
    if (error.code === "P2002") {
      if ((_h = (_g = error.meta) == null ? void 0 : _g.target) == null ? void 0 : _h.includes("sequencia")) {
        errorMessage = "J\xE1 existe um processo com esta sequ\xEAncia";
      } else {
        errorMessage = "J\xE1 existe um processo com estes dados";
      }
      statusCode = 400;
    } else if (error.code === "P2003") {
      errorMessage = "Respons\xE1vel n\xE3o encontrado";
      statusCode = 400;
    } else if (error.code === "P2025") {
      errorMessage = "Registro relacionado n\xE3o encontrado";
      statusCode = 404;
    }
    throw createError({
      statusCode,
      message: errorMessage
    });
  }
});

const index_post$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_post$2
}, Symbol.toStringTag, { value: 'Module' }));

const template_post = defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, "id");
    const body = await readBody(event);
    console.log("\u{1F3AF} Aplicando template - OP ID:", opId);
    console.log("\u{1F3AF} Template selecionado:", body.templateName);
    if (!opId) {
      throw createError({
        statusCode: 400,
        message: "ID da OP n\xE3o informado"
      });
    }
    if (!body.templateName) {
      throw createError({
        statusCode: 400,
        message: "Nome do template n\xE3o informado"
      });
    }
    const prisma = event.context.prisma;
    if (!prisma) {
      throw createError({
        statusCode: 500,
        message: "Prisma n\xE3o configurado no contexto"
      });
    }
    console.log("\u2705 Prisma encontrado no contexto");
    const templates = {
      PADRAO_MAQUINA: [
        { nome: "Lan\xE7amento da OP no Sistema", descricao: "Registro inicial da Ordem de Produ\xE7\xE3o no sistema", sequencia: 1, prazoEstimado: 1, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Cria\xE7\xE3o da Pasta do Projeto", descricao: "Cria\xE7\xE3o da estrutura de pastas para documenta\xE7\xE3o do projeto", sequencia: 2, prazoEstimado: 1, status: "NAO_INICIADO", progresso: 0 },
        { nome: "In\xEDcio do Projeto Mec\xE2nico", descricao: "In\xEDcio do desenvolvimento do projeto 3D no SolidWorks", sequencia: 3, prazoEstimado: 15, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Detalhamento das Pe\xE7as", descricao: "Cria\xE7\xE3o dos desenhos t\xE9cnicos e detalhamento de todas as pe\xE7as", sequencia: 4, prazoEstimado: 10, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Gera\xE7\xE3o da Lista de Pe\xE7as (BOM)", descricao: "Exporta\xE7\xE3o da planilha BOM do SolidWorks", sequencia: 5, prazoEstimado: 2, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Importa\xE7\xE3o da Lista de Pe\xE7as", descricao: "Upload e importa\xE7\xE3o da planilha BOM no sistema", sequencia: 6, prazoEstimado: 1, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Cria\xE7\xE3o de Roteiros de Fabrica\xE7\xE3o", descricao: "Cria\xE7\xE3o dos roteiros de pintura, zincagem e calibra\xE7\xE3o", sequencia: 7, prazoEstimado: 3, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Solicita\xE7\xE3o de Or\xE7amentos", descricao: "Envio de e-mails para cota\xE7\xE3o de pe\xE7as e servi\xE7os", sequencia: 8, prazoEstimado: 5, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Solicita\xE7\xE3o de Compras", descricao: "Emiss\xE3o de ordens de compra baseadas nos or\xE7amentos aprovados", sequencia: 9, prazoEstimado: 2, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Recebimento de Materiais", descricao: "Controle de recebimento e inspe\xE7\xE3o de materiais comprados", sequencia: 10, prazoEstimado: 10, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Montagem do Equipamento", descricao: "Montagem mec\xE2nica completa do equipamento", sequencia: 11, prazoEstimado: 15, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Projeto El\xE9trico e CLP", descricao: "Desenvolvimento da parte el\xE9trica e programa\xE7\xE3o do CLP/IHM", sequencia: 12, prazoEstimado: 10, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Testes do Equipamento", descricao: "Testes funcionais e de qualidade do equipamento montado", sequencia: 13, prazoEstimado: 5, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Documenta\xE7\xE3o T\xE9cnica", descricao: "Elabora\xE7\xE3o de manual t\xE9cnico, fotos e v\xEDdeos", sequencia: 14, prazoEstimado: 5, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Embalagem e Expedi\xE7\xE3o", descricao: "Prepara\xE7\xE3o para envio e expedi\xE7\xE3o ao cliente", sequencia: 15, prazoEstimado: 2, status: "NAO_INICIADO", progresso: 0 }
      ],
      SIMPLES: [
        { nome: "Lan\xE7amento da OP", descricao: "Registro inicial da OP", sequencia: 1, prazoEstimado: 1, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Projeto Mec\xE2nico", descricao: "Desenvolvimento do projeto 3D", sequencia: 2, prazoEstimado: 10, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Lista de Pe\xE7as", descricao: "Gera\xE7\xE3o e importa\xE7\xE3o do BOM", sequencia: 3, prazoEstimado: 2, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Compras", descricao: "Solicita\xE7\xE3o e acompanhamento de compras", sequencia: 4, prazoEstimado: 7, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Montagem", descricao: "Montagem do equipamento", sequencia: 5, prazoEstimado: 10, status: "NAO_INICIADO", progresso: 0 },
        { nome: "Testes e Entrega", descricao: "Testes finais e expedi\xE7\xE3o", sequencia: 6, prazoEstimado: 3, status: "NAO_INICIADO", progresso: 0 }
      ]
    };
    const templateProcesses = templates[body.templateName] || templates.PADRAO_MAQUINA;
    if (!templateProcesses) {
      throw createError({
        statusCode: 400,
        message: "Template n\xE3o encontrado"
      });
    }
    const opExistente = await prisma.oP.findUnique({
      where: {
        id: parseInt(opId)
      }
    });
    if (!opExistente) {
      throw createError({
        statusCode: 404,
        message: "OP n\xE3o encontrada"
      });
    }
    console.log("\u2705 OP encontrada:", opExistente.numeroOP);
    const processosExistentes = await prisma.oPProcesso.findMany({
      where: { opId: parseInt(opId) },
      select: { sequencia: true }
    });
    const sequenciasExistentes = processosExistentes.map((p) => p.sequencia);
    const maiorSequencia = sequenciasExistentes.length > 0 ? Math.max(...sequenciasExistentes) : 0;
    console.log(`\u{1F4CA} Processos existentes: ${processosExistentes.length}, Maior sequ\xEAncia: ${maiorSequencia}`);
    let dataInicioAtual = new Date(opExistente.dataInicio || opExistente.dataPedido || /* @__PURE__ */ new Date());
    dataInicioAtual.setHours(0, 0, 0, 0);
    const processosCriados = [];
    for (const [index, processo] of templateProcesses.entries()) {
      try {
        const dataInicioPrevista = new Date(dataInicioAtual);
        const dataTerminoPrevista = new Date(dataInicioPrevista);
        if (processo.prazoEstimado && processo.prazoEstimado > 0) {
          dataTerminoPrevista.setDate(dataTerminoPrevista.getDate() + processo.prazoEstimado - 1);
        }
        dataTerminoPrevista.setHours(0, 0, 0, 0);
        const novoProcesso = await prisma.oPProcesso.create({
          data: {
            opId: parseInt(opId),
            nome: processo.nome,
            descricao: processo.descricao,
            sequencia: maiorSequencia + index + 1,
            status: processo.status,
            progresso: processo.progresso,
            prazoEstimado: processo.prazoEstimado,
            dataInicioPrevista,
            dataTerminoPrevista,
            dataPrevista: null
          }
        });
        processosCriados.push(novoProcesso);
        dataInicioAtual = new Date(dataTerminoPrevista);
        dataInicioAtual.setDate(dataInicioAtual.getDate() + 1);
        dataInicioAtual.setHours(0, 0, 0, 0);
        console.log(`\u2705 Processo criado: ${processo.nome} (ID: ${novoProcesso.id}) - Datas: ${dataInicioPrevista.toISOString().split("T")[0]} a ${dataTerminoPrevista.toISOString().split("T")[0]}`);
      } catch (processError) {
        console.error(`\u274C Erro ao criar processo ${processo.nome}:`, processError);
      }
    }
    const todosProcessos = await prisma.oPProcesso.findMany({
      where: { opId: parseInt(opId) },
      select: { progresso: true }
    });
    const progressoMedio = todosProcessos.length > 0 ? Math.round(todosProcessos.reduce((sum, p) => sum + p.progresso, 0) / todosProcessos.length) : 0;
    await prisma.oP.update({
      where: { id: parseInt(opId) },
      data: { progresso: progressoMedio }
    });
    console.log(`\u{1F389} Template aplicado: ${processosCriados.length} processos criados`);
    return {
      success: true,
      processos: processosCriados,
      totalCriados: processosCriados.length,
      message: `Template aplicado com sucesso! ${processosCriados.length} processos criados.`
    };
  } catch (error) {
    console.error("\u274C Erro ao aplicar template:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Erro ao aplicar template"
    });
  }
});

const template_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: template_post
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$5 = new PrismaClient();
const index_get$2 = defineEventHandler(async (event) => {
  try {
    const ops = await prisma$5.oP.findMany({
      include: {
        criadoPor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        dataCriacao: "desc"
      }
    });
    return ops;
  } catch (error) {
    console.error("Erro ao carregar OPs:", error);
    throw createError({
      statusCode: 500,
      message: "Erro interno do servidor"
    });
  }
});

const index_get$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$2
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$4 = new PrismaClient();
const index_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (!body.numeroOP || !body.descricaoMaquina || !body.cliente) {
      throw createError({
        statusCode: 400,
        message: "N\xFAmero da OP, descri\xE7\xE3o e cliente s\xE3o obrigat\xF3rios"
      });
    }
    const existingOP = await prisma$4.oP.findFirst({
      where: {
        numeroOP: body.numeroOP
      }
    });
    if (existingOP) {
      throw createError({
        statusCode: 400,
        message: "J\xE1 existe uma OP com este n\xFAmero"
      });
    }
    const primeiroUsuario = await prisma$4.user.findFirst({
      select: { id: true }
    });
    if (!primeiroUsuario) {
      throw createError({
        statusCode: 400,
        message: "Nenhum usu\xE1rio encontrado no sistema"
      });
    }
    const op = await prisma$4.oP.create({
      data: {
        numeroOP: body.numeroOP,
        codigoMaquina: body.codigoMaquina,
        descricaoMaquina: body.descricaoMaquina,
        dataPedido: body.dataPedido ? new Date(body.dataPedido) : null,
        dataEntrega: body.dataEntrega ? new Date(body.dataEntrega) : null,
        cliente: body.cliente,
        cnpjCliente: body.cnpjCliente,
        enderecoCliente: body.enderecoCliente,
        observacoes: body.observacoes,
        status: body.status || "ABERTA",
        progresso: body.progresso || 0,
        criadoPorId: primeiroUsuario.id
        // ✅ Usar usuário válido
      },
      include: {
        criadoPor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    await prisma$4.oPHistorico.create({
      data: {
        opId: op.id,
        usuarioId: primeiroUsuario.id,
        acao: "OP criada",
        detalhes: `OP ${body.numeroOP} criada no sistema`
      }
    });
    return { success: true, op };
  } catch (error) {
    console.error("Erro ao criar OP:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Erro ao criar OP"
    });
  }
});

const index_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_post
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$3 = new PrismaClient();
const recent_get = defineEventHandler(async (event) => {
  try {
    const ops = await prisma$3.oP.findMany({
      take: 6,
      orderBy: { dataCriacao: "desc" },
      include: {
        responsavel: {
          select: { name: true }
        }
      }
    });
    return ops;
  } catch (error) {
    console.error("Erro ao carregar OPs recentes:", error);
    return [];
  }
});

const recent_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: recent_get
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$2 = new PrismaClient();
const salvar_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    const item = await prisma$2.item.create({
      data: {
        valor: body.valor
      }
    });
    return { success: true, item };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Erro ao salvar no banco de dados"
    });
  }
});

const salvar_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: salvar_post
}, Symbol.toStringTag, { value: 'Module' }));

const prisma$1 = new PrismaClient();
const index_get = defineEventHandler(async (event) => {
  try {
    const users = await prisma$1.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true
      },
      orderBy: { name: "asc" }
    });
    return users;
  } catch (error) {
    console.error("Erro ao carregar usu\xE1rios:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Erro interno do servidor"
    });
  }
});

const index_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get
}, Symbol.toStringTag, { value: 'Module' }));

const prisma = new PrismaClient();
const modules_get = defineEventHandler(async (event) => {
  try {
    const userData = await readBody(event).catch(() => null);
    const modules = await prisma.module.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        order: "asc"
      }
    });
    return modules;
  } catch (error) {
    console.error("Erro ao carregar m\xF3dulos:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Erro interno do servidor"
    });
  }
});

const modules_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: modules_get
}, Symbol.toStringTag, { value: 'Module' }));

function renderPayloadResponse(ssrContext) {
  return {
    body: stringify(splitPayload(ssrContext).payload, ssrContext._payloadReducers) ,
    statusCode: getResponseStatus(ssrContext.event),
    statusMessage: getResponseStatusText(ssrContext.event),
    headers: {
      "content-type": "application/json;charset=utf-8" ,
      "x-powered-by": "Nuxt"
    }
  };
}
function renderPayloadJsonScript(opts) {
  const contents = opts.data ? stringify(opts.data, opts.ssrContext._payloadReducers) : "";
  const payload = {
    "type": "application/json",
    "innerHTML": contents,
    "data-nuxt-data": appId,
    "data-ssr": false
  };
  {
    payload.id = "__NUXT_DATA__";
  }
  if (opts.src) {
    payload["data-src"] = opts.src;
  }
  const config = uneval(opts.ssrContext.config);
  return [
    payload,
    {
      innerHTML: `window.__NUXT__={};window.__NUXT__.config=${config}`
    }
  ];
}
function splitPayload(ssrContext) {
  const { data, prerenderedAt, ...initial } = ssrContext.payload;
  return {
    initial: { ...initial, prerenderedAt },
    payload: { data, prerenderedAt }
  };
}

const renderSSRHeadOptions = {"omitLineBreaks":false};

globalThis.__buildAssetsURL = buildAssetsURL;
globalThis.__publicAssetsURL = publicAssetsURL;
const HAS_APP_TELEPORTS = !!(appTeleportAttrs.id);
const APP_TELEPORT_OPEN_TAG = HAS_APP_TELEPORTS ? `<${appTeleportTag}${propsToString(appTeleportAttrs)}>` : "";
const APP_TELEPORT_CLOSE_TAG = HAS_APP_TELEPORTS ? `</${appTeleportTag}>` : "";
const PAYLOAD_URL_RE = /^[^?]*\/_payload.json(?:\?.*)?$/ ;
const renderer = defineRenderHandler(async (event) => {
  const nitroApp = useNitroApp();
  const ssrError = event.path.startsWith("/__nuxt_error") ? getQuery$1(event) : null;
  if (ssrError && !("__unenv__" in event.node.req)) {
    throw createError({
      statusCode: 404,
      statusMessage: "Page Not Found: /__nuxt_error"
    });
  }
  const ssrContext = createSSRContext(event);
  const headEntryOptions = { mode: "server" };
  ssrContext.head.push(appHead, headEntryOptions);
  if (ssrError) {
    ssrError.statusCode &&= Number.parseInt(ssrError.statusCode);
    setSSRError(ssrContext, ssrError);
  }
  const isRenderingPayload = PAYLOAD_URL_RE.test(ssrContext.url);
  if (isRenderingPayload) {
    const url = ssrContext.url.substring(0, ssrContext.url.lastIndexOf("/")) || "/";
    ssrContext.url = url;
    event._path = event.node.req.url = url;
  }
  const routeOptions = getRouteRules(event);
  if (routeOptions.ssr === false) {
    ssrContext.noSSR = true;
  }
  const renderer = await getRenderer();
  const _rendered = await renderer.renderToString(ssrContext).catch(async (error) => {
    if (ssrContext._renderResponse && error.message === "skipping render") {
      return {};
    }
    const _err = !ssrError && ssrContext.payload?.error || error;
    await ssrContext.nuxt?.hooks.callHook("app:error", _err);
    throw _err;
  });
  const inlinedStyles = [];
  await ssrContext.nuxt?.hooks.callHook("app:rendered", { ssrContext, renderResult: _rendered });
  if (ssrContext._renderResponse) {
    return ssrContext._renderResponse;
  }
  if (ssrContext.payload?.error && !ssrError) {
    throw ssrContext.payload.error;
  }
  if (isRenderingPayload) {
    const response = renderPayloadResponse(ssrContext);
    return response;
  }
  const NO_SCRIPTS = routeOptions.noScripts;
  const { styles, scripts } = getRequestDependencies(ssrContext, renderer.rendererContext);
  if (ssrContext._preloadManifest && !NO_SCRIPTS) {
    ssrContext.head.push({
      link: [
        { rel: "preload", as: "fetch", fetchpriority: "low", crossorigin: "anonymous", href: buildAssetsURL(`builds/meta/${ssrContext.runtimeConfig.app.buildId}.json`) }
      ]
    }, { ...headEntryOptions, tagPriority: "low" });
  }
  if (inlinedStyles.length) {
    ssrContext.head.push({ style: inlinedStyles });
  }
  const link = [];
  for (const resource of Object.values(styles)) {
    if ("inline" in getQuery(resource.file)) {
      continue;
    }
    link.push({ rel: "stylesheet", href: renderer.rendererContext.buildAssetsURL(resource.file), crossorigin: "" });
  }
  if (link.length) {
    ssrContext.head.push({ link }, headEntryOptions);
  }
  if (!NO_SCRIPTS) {
    ssrContext.head.push({
      link: getPreloadLinks(ssrContext, renderer.rendererContext)
    }, headEntryOptions);
    ssrContext.head.push({
      link: getPrefetchLinks(ssrContext, renderer.rendererContext)
    }, headEntryOptions);
    ssrContext.head.push({
      script: renderPayloadJsonScript({ ssrContext, data: ssrContext.payload }) 
    }, {
      ...headEntryOptions,
      // this should come before another end of body scripts
      tagPosition: "bodyClose",
      tagPriority: "high"
    });
  }
  if (!routeOptions.noScripts) {
    const tagPosition = "head";
    ssrContext.head.push({
      script: Object.values(scripts).map((resource) => ({
        type: resource.module ? "module" : null,
        src: renderer.rendererContext.buildAssetsURL(resource.file),
        defer: resource.module ? null : true,
        // if we are rendering script tag payloads that import an async payload
        // we need to ensure this resolves before executing the Nuxt entry
        tagPosition,
        crossorigin: ""
      }))
    }, headEntryOptions);
  }
  const { headTags, bodyTags, bodyTagsOpen, htmlAttrs, bodyAttrs } = await renderSSRHead(ssrContext.head, renderSSRHeadOptions);
  const htmlContext = {
    htmlAttrs: htmlAttrs ? [htmlAttrs] : [],
    head: normalizeChunks([headTags]),
    bodyAttrs: bodyAttrs ? [bodyAttrs] : [],
    bodyPrepend: normalizeChunks([bodyTagsOpen, ssrContext.teleports?.body]),
    body: [
      replaceIslandTeleports(ssrContext, _rendered.html) ,
      APP_TELEPORT_OPEN_TAG + (HAS_APP_TELEPORTS ? joinTags([ssrContext.teleports?.[`#${appTeleportAttrs.id}`]]) : "") + APP_TELEPORT_CLOSE_TAG
    ],
    bodyAppend: [bodyTags]
  };
  await nitroApp.hooks.callHook("render:html", htmlContext, { event });
  return {
    body: renderHTMLDocument(htmlContext),
    statusCode: getResponseStatus(event),
    statusMessage: getResponseStatusText(event),
    headers: {
      "content-type": "text/html;charset=utf-8",
      "x-powered-by": "Nuxt"
    }
  };
});
function normalizeChunks(chunks) {
  const result = [];
  for (const _chunk of chunks) {
    const chunk = _chunk?.trim();
    if (chunk) {
      result.push(chunk);
    }
  }
  return result;
}
function joinTags(tags) {
  return tags.join("");
}
function joinAttrs(chunks) {
  if (chunks.length === 0) {
    return "";
  }
  return " " + chunks.join(" ");
}
function renderHTMLDocument(html) {
  return `<!DOCTYPE html><html${joinAttrs(html.htmlAttrs)}><head>${joinTags(html.head)}</head><body${joinAttrs(html.bodyAttrs)}>${joinTags(html.bodyPrepend)}${joinTags(html.body)}${joinTags(html.bodyAppend)}</body></html>`;
}

const renderer$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: renderer
}, Symbol.toStringTag, { value: 'Module' }));
//# sourceMappingURL=index.mjs.map
