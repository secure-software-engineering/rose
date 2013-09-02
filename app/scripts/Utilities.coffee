require 'Constants'

class @Utilities
	@log: (message) ->
		# Get time.
		time = new Date().toTimeString()
		
		# Log.
		console.log "[ROSE " + time + "] " + message

	@hash: (data) ->
		if data
			saltedData = Constants.getSalt() + data
			shaObj = new jsSHA saltedData, "TEXT"
			hash = shaObj.getHash "SHA-512", "HEX"
			return hash[0...Constants.getHashLength()]
		else
			""

	@stripTags: (code) ->
		code.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, '')