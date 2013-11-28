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
		
		if observer.getObserverType() == "pattern"
			# Integrate observer the pattern way.
			$(observer.getIntegrationPatterns().join(", ")).each ->
				# Skip if already integrated.
				return if $(this).hasClass("rose-integrated")
		
				# Add integration class.
				$(this).addClass("rose-integrated")
				
				$(this).on observer.getEventType(), (e) ->
					# Get container.
					container = "status"
					if $(this).parents(".UFIComment").length
						container = "comment"

					# Get parsed information, if possible.
					parsed = observer.handleNode(this, container)
					
					if parsed['found']
						# If record is valid, save interaction.
						Storage.addInteraction(parsed['record'], name)
		
		if observer.getObserverType() == "classic"
			# Integrate observer the classic way.
			$(observer.getIntegrationPatterns().join(", ")).each ->
				# Skip if already integrated.
				return if $(this).hasClass("rose-integrated")
	
				# Add integration class.
				$(this).addClass("rose-integrated")
	
				# Add functionality.
				$(this).on observer.getEventType(), (e) ->
					# Get data.
					data = observer.getData($(this))
	
					# Add interaction.
					Storage.addInteraction(data, name)

	integrateIntoDOM: ->
		# Stub.
		true

	getNetworkName: ->
		@network