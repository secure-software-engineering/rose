require 'InteractionFactory'
require 'Storage/Storage'

class @Network
	# Network name.
	network:   "Facebook"

	# List of observers.
	observers: []
	
	# Pattern flag.
	patternsIntegrated: false

	isOnNetwork: ->
		# Stub.
		false

	applyObservers: ->
		# Check pattern observers.
		@integratePatternObserver()
		
		# Integrate observers.
		for observer in @observers
			@integrateObserver observer
	
	integratePatternObserver: ->
		if @patternsIntegrated
			return
		
		for observer in @observers
			if observer.getObserverType() == "pattern"
				observer.integrate()
		
		@patternsIntegrated = true

	integrateObserver: (observer) ->
		# Get network name.
		name = @getNetworkName()
		
		if observer.getObserverType() == "classic"
			# Integrate observer the classic way.
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