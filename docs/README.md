[Documentation](README.md)

# Documentation

## Index

### Classes

* [Getta](classes/getta.md)

### Interfaces

* [BuildEndpointOptions](interfaces/buildendpointoptions.md)
* [ConstructorOptions](interfaces/constructoroptions.md)
* [FetchOptions](interfaces/fetchoptions.md)
* [FetchRedirectHandlerOptions](interfaces/fetchredirecthandleroptions.md)
* [FetchResult](interfaces/fetchresult.md)
* [MockRequestCallbackParams](interfaces/mockrequestcallbackparams.md)
* [PendingRequestResolvers](interfaces/pendingrequestresolvers.md)
* [RequestOptions](interfaces/requestoptions.md)
* [RequestTracker](interfaces/requesttracker.md)
* [ResponseData](interfaces/responsedata.md)
* [ResponseDataWithErrors](interfaces/responsedatawitherrors.md)
* [Shortcuts](interfaces/shortcuts.md)
* [TearDownTestParams](interfaces/teardowntestparams.md)

### Type aliases

* [FetchMethod](README.md#fetchmethod)
* [PathTemplateCallback](README.md#pathtemplatecallback)
* [PendingRequestResolver](README.md#pendingrequestresolver)
* [ShortcutProperties](README.md#shortcutproperties)
* [StreamReader](README.md#streamreader)

### Variables

* [ARRAY_BUFFER_FORMAT](README.md#const-array_buffer_format)
* [BLOB_FORMAT](README.md#const-blob_format)
* [CACHE_CONTROL_HEADER](README.md#const-cache_control_header)
* [CLIENT_ERROR_REPSONSE](README.md#const-client_error_repsonse)
* [COOKIE_HEADER](README.md#const-cookie_header)
* [DEFAULT_FETCH_TIMEOUT](README.md#const-default_fetch_timeout)
* [DEFAULT_MAX_REDIRECTS](README.md#const-default_max_redirects)
* [DEFAULT_MAX_RETRIES](README.md#const-default_max_retries)
* [DEFAULT_PATH_TEMPLATE_REGEX](README.md#const-default_path_template_regex)
* [DEFAULT_REQUEST_RETRY_WAIT](README.md#const-default_request_retry_wait)
* [DELETE_METHOD](README.md#const-delete_method)
* [ETAG_HEADER](README.md#const-etag_header)
* [FETCH_METHODS](README.md#const-fetch_methods)
* [FETCH_TIMEOUT_ERROR](README.md#const-fetch_timeout_error)
* [FORM_DATA_FORMAT](README.md#const-form_data_format)
* [GET_METHOD](README.md#const-get_method)
* [IF_NONE_MATCH_HEADER](README.md#const-if_none_match_header)
* [INFORMATION_REPSONSE](README.md#const-information_repsonse)
* [INVALID_FETCH_METHOD_ERROR](README.md#const-invalid_fetch_method_error)
* [JSON_FORMAT](README.md#const-json_format)
* [LOCATION_HEADER](README.md#const-location_header)
* [MAX_REDIRECTS_EXCEEDED_ERROR](README.md#const-max_redirects_exceeded_error)
* [MAX_RETRIES_EXCEEDED_ERROR](README.md#const-max_retries_exceeded_error)
* [MISSING_BASE_PATH_ERROR](README.md#const-missing_base_path_error)
* [NOT_FOUND_STATUS_CODE](README.md#const-not_found_status_code)
* [NOT_MODIFIED_STATUS_CODE](README.md#const-not_modified_status_code)
* [POST_METHOD](README.md#const-post_method)
* [PUT_METHOD](README.md#const-put_method)
* [REDIRECTION_REPSONSE](README.md#const-redirection_repsonse)
* [RESOURCE_NOT_FOUND_ERROR](README.md#const-resource_not_found_error)
* [SERVER_ERROR_REPSONSE](README.md#const-server_error_repsonse)
* [SUCCESSFUL_REPSONSE](README.md#const-successful_repsonse)
* [TEXT_FORMAT](README.md#const-text_format)
* [basePath](README.md#const-basepath)
* [defaultEtag](README.md#const-defaultetag)
* [defaultPath](README.md#const-defaultpath)
* [defaultPayload](README.md#const-defaultpayload)

### Functions

* [DEFAULT_BODY_PARSER](README.md#const-default_body_parser)
* [DEFAULT_PATH_TEMPLATE_CALLBACK](README.md#const-default_path_template_callback)
* [buildEndpoint](README.md#buildendpoint)
* [createRestClient](README.md#createrestclient)
* [delay](README.md#delay)
* [getCache](README.md#getcache)
* [getResponseGroup](README.md#getresponsegroup)
* [isCacheabilityValid](README.md#iscacheabilityvalid)
* [mockRequest](README.md#mockrequest)
* [resolveResponseData](README.md#resolveresponsedata)
* [tearDownTest](README.md#teardowntest)

### Object literals

* [DEFAULT_HEADERS](README.md#const-default_headers)
* [PRD_136_7317](README.md#const-prd_136_7317)
* [PRD_180_1387](README.md#const-prd_180_1387)
* [PRD_183_3905](README.md#const-prd_183_3905)
* [PRD_202_3315](README.md#const-prd_202_3315)
* [STREAM_READERS](README.md#const-stream_readers)
* [defaultHeaders](README.md#const-defaultheaders)
* [defaultPathTemplateData](README.md#const-defaultpathtemplatedata)
* [idPathTemplateData](README.md#const-idpathtemplatedata)
* [pathTemplateDataWithoutID](README.md#const-pathtemplatedatawithoutid)

## Type aliases

###  FetchMethod

Ƭ **FetchMethod**: *"get" | "post" | "put" | "delete"*

*Defined in [src/types.ts:6](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/types.ts#L6)*

___

###  PathTemplateCallback

Ƭ **PathTemplateCallback**: *function*

*Defined in [src/types.ts:63](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/types.ts#L63)*

#### Type declaration:

▸ (`path`: string, `data`: StringObjectMap, `pathTemplateRegExp`: RegExp): *string*

**Parameters:**

Name | Type |
------ | ------ |
`path` | string |
`data` | StringObjectMap |
`pathTemplateRegExp` | RegExp |

___

###  PendingRequestResolver

Ƭ **PendingRequestResolver**: *function*

*Defined in [src/types.ts:65](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/types.ts#L65)*

#### Type declaration:

▸ (`value?`: [ResponseDataWithErrors](interfaces/responsedatawitherrors.md)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`value?` | [ResponseDataWithErrors](interfaces/responsedatawitherrors.md) |

___

###  ShortcutProperties

Ƭ **ShortcutProperties**: *object*

*Defined in [src/types.ts:10](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/types.ts#L10)*

#### Type declaration:

___

###  StreamReader

Ƭ **StreamReader**: *"arrayBuffer" | "blob" | "formData" | "json" | "text"*

*Defined in [src/types.ts:8](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/types.ts#L8)*

## Variables

### `Const` ARRAY_BUFFER_FORMAT

• **ARRAY_BUFFER_FORMAT**: *"arrayBuffer"* =  "arrayBuffer" as const

*Defined in [src/constants.ts:4](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L4)*

___

### `Const` BLOB_FORMAT

• **BLOB_FORMAT**: *"blob"* =  "blob" as const

*Defined in [src/constants.ts:5](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L5)*

___

### `Const` CACHE_CONTROL_HEADER

• **CACHE_CONTROL_HEADER**: *"Cache-Control"* =  "Cache-Control" as const

*Defined in [src/constants.ts:74](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L74)*

___

### `Const` CLIENT_ERROR_REPSONSE

• **CLIENT_ERROR_REPSONSE**: *"clientError"* =  "clientError" as const

*Defined in [src/constants.ts:64](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L64)*

___

### `Const` COOKIE_HEADER

• **COOKIE_HEADER**: *"Cookie"* =  "Cookie" as const

*Defined in [src/constants.ts:70](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L70)*

___

### `Const` DEFAULT_FETCH_TIMEOUT

• **DEFAULT_FETCH_TIMEOUT**: *5000* =  5000 as const

*Defined in [src/constants.ts:19](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L19)*

___

### `Const` DEFAULT_MAX_REDIRECTS

• **DEFAULT_MAX_REDIRECTS**: *5* =  5 as const

*Defined in [src/constants.ts:21](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L21)*

___

### `Const` DEFAULT_MAX_RETRIES

• **DEFAULT_MAX_RETRIES**: *3* =  3 as const

*Defined in [src/constants.ts:22](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L22)*

___

### `Const` DEFAULT_PATH_TEMPLATE_REGEX

• **DEFAULT_PATH_TEMPLATE_REGEX**: *RegExp‹›* =  /({type})|({id})|({id,\+})|({brief\|standard})/g

*Defined in [src/constants.ts:23](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L23)*

___

### `Const` DEFAULT_REQUEST_RETRY_WAIT

• **DEFAULT_REQUEST_RETRY_WAIT**: *100* = 100

*Defined in [src/constants.ts:24](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L24)*

___

### `Const` DELETE_METHOD

• **DELETE_METHOD**: *"delete"* =  "delete" as const

*Defined in [src/constants.ts:57](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L57)*

___

### `Const` ETAG_HEADER

• **ETAG_HEADER**: *"ETag"* =  "ETag" as const

*Defined in [src/constants.ts:71](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L71)*

___

### `Const` FETCH_METHODS

• **FETCH_METHODS**: *"get" | "post" | "put" | "delete"[]* =  [GET_METHOD, POST_METHOD, PUT_METHOD, DELETE_METHOD]

*Defined in [src/constants.ts:59](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L59)*

___

### `Const` FETCH_TIMEOUT_ERROR

• **FETCH_TIMEOUT_ERROR**: *"The request timed out. Getta did not get a response within"* = "The request timed out. Getta did not get a response within"

*Defined in [src/constants.ts:52](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L52)*

___

### `Const` FORM_DATA_FORMAT

• **FORM_DATA_FORMAT**: *"formData"* =  "formData" as const

*Defined in [src/constants.ts:6](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L6)*

___

### `Const` GET_METHOD

• **GET_METHOD**: *"get"* =  "get" as const

*Defined in [src/constants.ts:54](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L54)*

___

### `Const` IF_NONE_MATCH_HEADER

• **IF_NONE_MATCH_HEADER**: *"If-None-Match"* =  "If-None-Match" as const

*Defined in [src/constants.ts:73](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L73)*

___

### `Const` INFORMATION_REPSONSE

• **INFORMATION_REPSONSE**: *"information"* =  "information" as const

*Defined in [src/constants.ts:61](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L61)*

___

### `Const` INVALID_FETCH_METHOD_ERROR

• **INVALID_FETCH_METHOD_ERROR**: *"Getta expected to receive 'get', 'post', 'put' or 'delete', but received"* = "Getta expected to receive 'get', 'post', 'put' or 'delete', but received"

*Defined in [src/constants.ts:48](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L48)*

___

### `Const` JSON_FORMAT

• **JSON_FORMAT**: *"json"* =  "json" as const

*Defined in [src/constants.ts:7](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L7)*

___

### `Const` LOCATION_HEADER

• **LOCATION_HEADER**: *"Location"* =  "Location" as const

*Defined in [src/constants.ts:72](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L72)*

___

### `Const` MAX_REDIRECTS_EXCEEDED_ERROR

• **MAX_REDIRECTS_EXCEEDED_ERROR**: *"The request exceeded the maximum number of redirects, which is"* = "The request exceeded the maximum number of redirects, which is"

*Defined in [src/constants.ts:44](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L44)*

___

### `Const` MAX_RETRIES_EXCEEDED_ERROR

• **MAX_RETRIES_EXCEEDED_ERROR**: *"The request exceeded the maximum number of retries, which is"* = "The request exceeded the maximum number of retries, which is"

*Defined in [src/constants.ts:46](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L46)*

___

### `Const` MISSING_BASE_PATH_ERROR

• **MISSING_BASE_PATH_ERROR**: *"Getta expected to receive 'basePath' in the constructor options,
  but recevied undefined."* =  `Getta expected to receive 'basePath' in the constructor options,
  but recevied undefined.`

*Defined in [src/constants.ts:41](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L41)*

___

### `Const` NOT_FOUND_STATUS_CODE

• **NOT_FOUND_STATUS_CODE**: *404* =  404 as const

*Defined in [src/constants.ts:68](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L68)*

___

### `Const` NOT_MODIFIED_STATUS_CODE

• **NOT_MODIFIED_STATUS_CODE**: *304* =  304 as const

*Defined in [src/constants.ts:67](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L67)*

___

### `Const` POST_METHOD

• **POST_METHOD**: *"post"* =  "post" as const

*Defined in [src/constants.ts:55](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L55)*

___

### `Const` PUT_METHOD

• **PUT_METHOD**: *"put"* =  "put" as const

*Defined in [src/constants.ts:56](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L56)*

___

### `Const` REDIRECTION_REPSONSE

• **REDIRECTION_REPSONSE**: *"redirection"* =  "redirection" as const

*Defined in [src/constants.ts:63](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L63)*

___

### `Const` RESOURCE_NOT_FOUND_ERROR

• **RESOURCE_NOT_FOUND_ERROR**: *"The requested resource could not been found."* = "The requested resource could not been found."

*Defined in [src/constants.ts:50](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L50)*

___

### `Const` SERVER_ERROR_REPSONSE

• **SERVER_ERROR_REPSONSE**: *"serverError"* =  "serverError" as const

*Defined in [src/constants.ts:65](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L65)*

___

### `Const` SUCCESSFUL_REPSONSE

• **SUCCESSFUL_REPSONSE**: *"successful"* =  "successful" as const

*Defined in [src/constants.ts:62](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L62)*

___

### `Const` TEXT_FORMAT

• **TEXT_FORMAT**: *"text"* =  "text" as const

*Defined in [src/constants.ts:8](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L8)*

___

### `Const` basePath

• **basePath**: *"https://tesco.com"* = "https://tesco.com"

*Defined in [src/__test__/helpers/index.ts:9](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L9)*

___

### `Const` defaultEtag

• **defaultEtag**: *"33a64df551425fcc55e4d42a148795d9f25f89d4"* = "33a64df551425fcc55e4d42a148795d9f25f89d4"

*Defined in [src/__test__/helpers/index.ts:21](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L21)*

___

### `Const` defaultPath

• **defaultPath**: *"/direct/rest/content/catalog/{type}/{id,+}?format={brief|standard}"* = "/direct/rest/content/catalog/{type}/{id,+}?format={brief|standard}"

*Defined in [src/__test__/helpers/index.ts:11](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L11)*

___

### `Const` defaultPayload

• **defaultPayload**: *"{ payload: true }"* = "{ payload: true }"

*Defined in [src/__test__/helpers/index.ts:15](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L15)*

## Functions

### `Const` DEFAULT_BODY_PARSER

▸ **DEFAULT_BODY_PARSER**(`body`: JsonValue): *null | string | number | false | true | object | JsonArray‹›*

*Defined in [src/constants.ts:18](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`body` | JsonValue |

**Returns:** *null | string | number | false | true | object | JsonArray‹›*

___

### `Const` DEFAULT_PATH_TEMPLATE_CALLBACK

▸ **DEFAULT_PATH_TEMPLATE_CALLBACK**(`pathTemplate`: string, `data`: StringObjectMap, `pathTemplateRegExp`: RegExp): *string*

*Defined in [src/constants.ts:26](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`pathTemplate` | string |
`data` | StringObjectMap |
`pathTemplateRegExp` | RegExp |

**Returns:** *string*

___

###  buildEndpoint

▸ **buildEndpoint**(`basePath`: string, `path`: string, `__namedParameters`: object): *string*

*Defined in [src/helpers/build-endpoint/index.ts:4](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/helpers/build-endpoint/index.ts#L4)*

**Parameters:**

▪ **basePath**: *string*

▪ **path**: *string*

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`pathTemplateCallback` | function |
`pathTemplateData` | undefined &#124; StringObjectMap |
`pathTemplateRegExp` | RegExp‹› |
`queryParams` | undefined &#124; object |

**Returns:** *string*

___

###  createRestClient

▸ **createRestClient**<**N**>(`options`: [ConstructorOptions](interfaces/constructoroptions.md), `shortcuts?`: [Shortcuts](interfaces/shortcuts.md)): *[Getta](classes/getta.md)‹› & object*

*Defined in [src/main.ts:384](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/main.ts#L384)*

**Type parameters:**

▪ **N**: *string*

**Parameters:**

Name | Type |
------ | ------ |
`options` | [ConstructorOptions](interfaces/constructoroptions.md) |
`shortcuts?` | [Shortcuts](interfaces/shortcuts.md) |

**Returns:** *[Getta](classes/getta.md)‹› & object*

___

###  delay

▸ **delay**(`ms`: number): *Promise‹unknown›*

*Defined in [src/helpers/delay/index.ts:1](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/helpers/delay/index.ts#L1)*

**Parameters:**

Name | Type |
------ | ------ |
`ms` | number |

**Returns:** *Promise‹unknown›*

___

###  getCache

▸ **getCache**(): *Core‹›*

*Defined in [src/__test__/helpers/index.ts:29](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L29)*

**Returns:** *Core‹›*

___

###  getResponseGroup

▸ **getResponseGroup**(`status`: number): *"information" | "successful" | "redirection" | "clientError" | "serverError"*

*Defined in [src/helpers/get-response-group/index.ts:9](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/helpers/get-response-group/index.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`status` | number |

**Returns:** *"information" | "successful" | "redirection" | "clientError" | "serverError"*

___

###  isCacheabilityValid

▸ **isCacheabilityValid**(`cacheability`: Cacheability): *boolean*

*Defined in [src/helpers/is-cacheability-valid/index.ts:3](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/helpers/is-cacheability-valid/index.ts#L3)*

**Parameters:**

Name | Type |
------ | ------ |
`cacheability` | Cacheability |

**Returns:** *boolean*

___

###  mockRequest

▸ **mockRequest**(`path`: string, `body`: JsonValue, `__namedParameters`: object, `callback`: function): *void*

*Defined in [src/__test__/helpers/index.ts:36](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L36)*

**Parameters:**

▪ **path**: *string*

▪ **body**: *JsonValue*

▪`Default value`  **__namedParameters**: *object*=  {}

Name | Type |
------ | ------ |
`headers` | StringObjectMap |
`pathTemplateData` | undefined &#124; StringObjectMap |
`queryParams` | undefined &#124; object |

▪ **callback**: *function*

▸ (`options`: [MockRequestCallbackParams](interfaces/mockrequestcallbackparams.md)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`options` | [MockRequestCallbackParams](interfaces/mockrequestcallbackparams.md) |

**Returns:** *void*

___

###  resolveResponseData

▸ **resolveResponseData**(`__namedParameters`: object): *[ResponseDataWithErrors](interfaces/responsedatawitherrors.md)*

*Defined in [src/helpers/resolve-response-data/index.ts:3](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/helpers/resolve-response-data/index.ts#L3)*

**Parameters:**

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`data` | undefined &#124; null &#124; string &#124; number &#124; false &#124; true &#124; object &#124; JsonArray‹› |
`errors` | undefined &#124; Error[] |

**Returns:** *[ResponseDataWithErrors](interfaces/responsedatawitherrors.md)*

___

###  tearDownTest

▸ **tearDownTest**(`__namedParameters`: object): *Promise‹void›*

*Defined in [src/__test__/helpers/index.ts:54](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L54)*

**Parameters:**

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`fetchMock` | FetchMockStatic‹› |
`restClient` | [Getta](classes/getta.md)‹› |

**Returns:** *Promise‹void›*

## Object literals

### `Const` DEFAULT_HEADERS

### ▪ **DEFAULT_HEADERS**: *object*

*Defined in [src/constants.ts:20](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L20)*

###  content-type

• **content-type**: *string* = "application/json"

*Defined in [src/constants.ts:20](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L20)*

___

### `Const` PRD_136_7317

### ▪ **PRD_136_7317**: *object*

*Defined in [src/__test__/data/index.ts:1](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/data/index.ts#L1)*

###  body

• **body**: *any* =  require("./136-7317.json")

*Defined in [src/__test__/data/index.ts:2](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/data/index.ts#L2)*

###  url

• **url**: *string* = "https://www.tesco.com/direct/rest/content/catalog/product/136-7317"

*Defined in [src/__test__/data/index.ts:3](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/data/index.ts#L3)*

___

### `Const` PRD_180_1387

### ▪ **PRD_180_1387**: *object*

*Defined in [src/__test__/data/index.ts:6](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/data/index.ts#L6)*

###  body

• **body**: *any* =  require("./180-1387.json")

*Defined in [src/__test__/data/index.ts:7](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/data/index.ts#L7)*

###  url

• **url**: *string* = "https://www.tesco.com/direct/rest/content/catalog/product/180-1387"

*Defined in [src/__test__/data/index.ts:8](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/data/index.ts#L8)*

___

### `Const` PRD_183_3905

### ▪ **PRD_183_3905**: *object*

*Defined in [src/__test__/data/index.ts:11](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/data/index.ts#L11)*

###  body

• **body**: *any* =  require("./183-3905.json")

*Defined in [src/__test__/data/index.ts:12](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/data/index.ts#L12)*

###  url

• **url**: *string* = "https://www.tesco.com/direct/rest/content/catalog/product/183-3905"

*Defined in [src/__test__/data/index.ts:13](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/data/index.ts#L13)*

___

### `Const` PRD_202_3315

### ▪ **PRD_202_3315**: *object*

*Defined in [src/__test__/data/index.ts:16](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/data/index.ts#L16)*

###  body

• **body**: *any* =  require("./202-3315.json")

*Defined in [src/__test__/data/index.ts:17](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/data/index.ts#L17)*

###  url

• **url**: *string* = "https://www.tesco.com/direct/rest/content/catalog/product/202-3315"

*Defined in [src/__test__/data/index.ts:18](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/data/index.ts#L18)*

___

### `Const` STREAM_READERS

### ▪ **STREAM_READERS**: *object*

*Defined in [src/constants.ts:10](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L10)*

###  ARRAY_BUFFER_FORMAT

• **ARRAY_BUFFER_FORMAT**: *"arrayBuffer"*

*Defined in [src/constants.ts:11](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L11)*

###  BLOB_FORMAT

• **BLOB_FORMAT**: *"blob"*

*Defined in [src/constants.ts:12](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L12)*

###  FORM_DATA_FORMAT

• **FORM_DATA_FORMAT**: *"formData"*

*Defined in [src/constants.ts:13](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L13)*

###  JSON_FORMAT

• **JSON_FORMAT**: *"json"*

*Defined in [src/constants.ts:14](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L14)*

###  TEXT_FORMAT

• **TEXT_FORMAT**: *"text"*

*Defined in [src/constants.ts:15](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/constants.ts#L15)*

___

### `Const` defaultHeaders

### ▪ **defaultHeaders**: *object*

*Defined in [src/__test__/helpers/index.ts:23](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L23)*

###  cache-control

• **cache-control**: *string* = "public, max-age=6000"

*Defined in [src/__test__/helpers/index.ts:24](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L24)*

###  content-type

• **content-type**: *string* = "application/json"

*Defined in [src/__test__/helpers/index.ts:25](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L25)*

###  etag

• **etag**: *string* =  defaultEtag

*Defined in [src/__test__/helpers/index.ts:26](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L26)*

___

### `Const` defaultPathTemplateData

### ▪ **defaultPathTemplateData**: *object*

*Defined in [src/__test__/helpers/index.ts:13](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L13)*

###  brief|standard

• **brief|standard**: *string* = "standard"

*Defined in [src/__test__/helpers/index.ts:13](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L13)*

###  id,+

• **id,+**: *string* = "136-7317"

*Defined in [src/__test__/helpers/index.ts:13](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L13)*

###  type

• **type**: *string* = "product"

*Defined in [src/__test__/helpers/index.ts:13](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L13)*

___

### `Const` idPathTemplateData

### ▪ **idPathTemplateData**: *object*

*Defined in [src/__test__/helpers/index.ts:17](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L17)*

###  id,+

• **id,+**: *string* = "136-7317"

*Defined in [src/__test__/helpers/index.ts:17](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L17)*

___

### `Const` pathTemplateDataWithoutID

### ▪ **pathTemplateDataWithoutID**: *object*

*Defined in [src/__test__/helpers/index.ts:19](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L19)*

###  brief|standard

• **brief|standard**: *string* = "standard"

*Defined in [src/__test__/helpers/index.ts:19](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L19)*

###  type

• **type**: *string* = "product"

*Defined in [src/__test__/helpers/index.ts:19](https://github.com/dylanaubrey/getta/blob/fa6c8f6/src/__test__/helpers/index.ts#L19)*
