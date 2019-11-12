[Documentation](../README.md) › [Getta](getta.md)

# Class: Getta

## Hierarchy

* **Getta**

## Index

### Constructors

* [constructor](getta.md#constructor)

### Accessors

* [cache](getta.md#cache)

### Methods

* [createShortcut](getta.md#createshortcut)
* [delete](getta.md#delete)
* [get](getta.md#get)
* [post](getta.md#post)
* [put](getta.md#put)

## Constructors

###  constructor

\+ **new Getta**(`options`: [ConstructorOptions](../interfaces/constructoroptions.md)): *[Getta](getta.md)*

*Defined in [main.ts:73](https://github.com/dylanaubrey/getta/blob/5fa0964/src/main.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`options` | [ConstructorOptions](../interfaces/constructoroptions.md) |

**Returns:** *[Getta](getta.md)*

## Accessors

###  cache

• **get cache**(): *Cachemap | undefined*

*Defined in [main.ts:111](https://github.com/dylanaubrey/getta/blob/5fa0964/src/main.ts#L111)*

**Returns:** *Cachemap | undefined*

## Methods

###  createShortcut

▸ **createShortcut**(`name`: string, `path`: string, `__namedParameters`: object): *void*

*Defined in [main.ts:115](https://github.com/dylanaubrey/getta/blob/5fa0964/src/main.ts#L115)*

**Parameters:**

▪ **name**: *string*

▪ **path**: *string*

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`method` | "get" &#124; "post" &#124; "put" &#124; "delete" |
`rest` | [rest](undefined) |

**Returns:** *void*

___

###  delete

▸ **delete**(`path`: string, `options`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ResponseDataWithErrors](../interfaces/responsedatawitherrors.md)›*

*Defined in [main.ts:124](https://github.com/dylanaubrey/getta/blob/5fa0964/src/main.ts#L124)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`path` | string | - |
`options` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ResponseDataWithErrors](../interfaces/responsedatawitherrors.md)›*

___

###  get

▸ **get**(`path`: string, `options`: [RequestOptions](../interfaces/requestoptions.md)): *Promise‹[ResponseDataWithErrors](../interfaces/responsedatawitherrors.md)›*

*Defined in [main.ts:128](https://github.com/dylanaubrey/getta/blob/5fa0964/src/main.ts#L128)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`path` | string | - |
`options` | [RequestOptions](../interfaces/requestoptions.md) |  {} |

**Returns:** *Promise‹[ResponseDataWithErrors](../interfaces/responsedatawitherrors.md)›*

___

###  post

▸ **post**(`path`: string, `options`: Required‹[RequestOptions](../interfaces/requestoptions.md), "body"›): *Promise‹[ResponseDataWithErrors](../interfaces/responsedatawitherrors.md)›*

*Defined in [main.ts:132](https://github.com/dylanaubrey/getta/blob/5fa0964/src/main.ts#L132)*

**Parameters:**

Name | Type |
------ | ------ |
`path` | string |
`options` | Required‹[RequestOptions](../interfaces/requestoptions.md), "body"› |

**Returns:** *Promise‹[ResponseDataWithErrors](../interfaces/responsedatawitherrors.md)›*

___

###  put

▸ **put**(`path`: string, `options`: Required‹[RequestOptions](../interfaces/requestoptions.md), "body"›): *Promise‹[ResponseDataWithErrors](../interfaces/responsedatawitherrors.md)›*

*Defined in [main.ts:136](https://github.com/dylanaubrey/getta/blob/5fa0964/src/main.ts#L136)*

**Parameters:**

Name | Type |
------ | ------ |
`path` | string |
`options` | Required‹[RequestOptions](../interfaces/requestoptions.md), "body"› |

**Returns:** *Promise‹[ResponseDataWithErrors](../interfaces/responsedatawitherrors.md)›*
