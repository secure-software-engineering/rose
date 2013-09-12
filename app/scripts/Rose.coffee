require 'Management'

class window.Rose
	@mutationObserver: null

	@startRose: ->
		# Initialize Management.
		Management.initialize()

		# Set event handling.
		Rose.mutationObserver = new MutationObserver () ->
			Rose.integrate()

		# Start observation.
		Rose.mutationObserver.observe document, {
			subtree:       true,
			childList:     true,
			characterData: true
		}

		# Integrate into site.
		Rose.integrate()

	@integrate: ->
		# Get list of networks.
		networks = Management.getListOfNetworks()

		# Integrate networks, if possible.
		for network in networks
			# Continue unless applicable.
			continue unless network.isOnNetwork()

			# Apply observers.
			network.applyObservers()

			# Integrate into DOM.
			network.integrateIntoDOM()