class @DOM
	@findRelative: (obj, classes) ->
		for name of classes
			node = obj.closest(name).find(classes[name]).html()
			return node if node && obj.closest(name).find(obj).length > 0
		return "error"