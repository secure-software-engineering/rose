class MyExtension
    constructor: ->
        roseStorage = kango.storage.getItem 'roseStorage'
        unless roseStorage?
            roseStorage = 
                platforms: []
                diary: []

            kango.storage.setItem 'roseStorage', roseStorage

extension = new MyExtension()
