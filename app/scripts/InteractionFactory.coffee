class @InteractionFactory
	@createInteraction: (data) ->
		# Create interaction.
		interaction = {}

		# Set fixed field.
		interaction["object_id"] = Utilities.hash(id)

		# Merge meta data.
		for key of metaData
			interaction[key] = metaData[key]

		# Return interaction.
		return interaction