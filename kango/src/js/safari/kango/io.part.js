function IO(){}var utils=require("kango/utils"),object=utils.object;IO.prototype=object.extend(IOBase,{getExtensionFileUrl:function(e){return safari.extension.baseURI+e},getResourceUrl:function(e){return this.getExtensionFileUrl(e)}}),module.exports=new IO,module.exports.getPublicApi=getPublicApi;