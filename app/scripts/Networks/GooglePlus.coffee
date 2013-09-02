class window.GooglePlus extends Network
	# Network name.
	network:   "GooglePlus"

	# List of observers.
	observers: []

	constructor: ->
		# Add observers.
		@observers.push new GooglePlusPlusOneObserver()
		# @observers.push new GooglePlusAddToCircleObserver
		# @observers.push new GooglePlusShareObserver

	isOnNetwork: ->
		(window.location + "").indexOf("plus.google.com") >= 0

	integrateIntoDOM: ->
		# Stub.
		true

	getNetworkName: ->
		@network