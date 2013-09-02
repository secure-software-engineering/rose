require 'Networks/Facebook'
require 'Networks/GooglePlus'

class window.Management
	@networks: []

	@isInitialized: false

	@initialize: ->
		if not Management.isInitialized
			# Add networks to Management.
			Management.add new Facebook()
			Management.add new GooglePlus()

			# Set initialized flag.
			Management.isInitialized = true

	@getListOfNetworks: ->
		Management.networks

	@add: (network) ->
		Management.networks.push network
        