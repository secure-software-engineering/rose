require 'InteractionFactory'
require 'Storage/Storage'

class @Network
	# Network name.
	network:   "Facebook"

	# List of observers.
	observers: []

	isOnNetwork: ->
		# Stub.
		false

	applyObservers: ->
		# Integrate observers.
		for observer in @observers
			@integrateObserver observer

	integrateObserver: (observer) ->
		# Get network name.
		name = @getNetworkName()

		# Integrate observer.
		$(observer.getIntegrationPatterns().join(", ")).each ->
			# Skip if already integrated.
			return if $(this).hasClass("rose-integrated")

			# Add integration class.
			$(this).addClass("rose-integrated")

			# Add functionality.
			$(this).on observer.getEventType(), (e) ->
				# Get ID.
				id = observer.getID($(this))

				# Get meta data.
				metaData = observer.getMetaData($(this))

				# Create interaction...
				interaction = InteractionFactory.createInteraction(id, metaData)

				# ... and save to storage.
				Storage.addInteraction(interaction, name)

	integrateIntoDOM: ->
		# Stub.
		true

	getNetworkName: ->
		@network