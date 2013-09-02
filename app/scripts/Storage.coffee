class @Storage
    @setInteraction: (interaction, provider) ->
        # get roseStorage
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            platforms = roseStorage.platforms
            # select platform from roseStorage
            dataSet = platform for platform in platforms when platform.name is provider

            # create new platform if unknown
            unless dataSet
                dataSet = 
                    name: provider
                    interactions: []
                platforms.push dataSet

            interactions = dataSet.interactions

            # create new interaction
            newInteraction = 
                id: interactions.length
                createdAt: new Date()
                deleted: false
                content: interaction

            # add new interaction to interactions array
            interactions.push newInteraction
            # write roseStorage back into browser storage
            kango.invokeAsync 'kango.storage.setItem', 'roseStorage', roseStorage

    @getInteraction: (id, callback) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            interactions = roseStorage.interactions ?= []
            callback item for item in interactions when item.id is id
    @getAllInteractions: (provider, callback) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            platforms = roseStorage.platforms
            dataSet = platform for platform in platforms when platform.name is provider

            callback dataSet.interactions ?= []

    @removeInteraction: (id) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            roseStorage = data
            interactions = roseStorage.interactions ?= []

            for item in interactions
                if item.id is id
                    item.deleted = true
                    item.content = null

            roseStorage['interactions'] = interactions
            kango.invokeAsync 'roseStorage.setInteraction', 'roseStorage', roseStorage

    setComment: (comment) ->
    getComment: (id) ->
    @getAllComments: (provider, callback) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            platforms = roseStorage.platforms
            dataSet = platform for platform in platforms when platform.name is provider

            if dataSet?.comment?
                callback dataSet.comment
            else
                callback []

    removeComment: ->

    @setDiaryEntry: (entry) ->
    @getDiaryEntry: (id, callback) ->
    @getAllDiaryEntries: (callback) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            callback roseStorage.diary ?= []

    @removeDiaryEntry: (id) ->

    @setPrivacySettings: (provider, settings) ->
    @getPrivacySettings: (provider, callback) ->
        callback []

    # FIXME: remove functions - just for interface rigt now
    @saveInteraction: (interaction, provider) ->
        Storage.setInteraction interaction, provider
    @getInteractions: (provider, callback) ->
        Storage.getAllInteractions provider, callback
    @getDiary: (callback) ->
        Storage.getAllDiaryEntries callback
    @getComments: (provider, callback) ->
        Storage.getAllComments(provider, callback)
    @getPrivacyEntry: (provider, callback) ->
        @getPrivacySettings provider, callback


## Interface Doc 

# class StorageEngine
#     instance = null

#     @get: ->
#         instance ?= new PrivateStorageEngine()

#     class PrivateStorageEngine
#         setInteraction: (interaction) ->
#         getInteraction: (id) ->
#         getAllInteractions: ->
#         removeInteraction: (id) ->

#         setComment: (commant) ->
#         getComment: (id) ->
#         getAllComments: ->
#         removeComment: ->

#         setDiaryEntry: (entry) ->
#         getDiaryEntry: (id) ->
#         getAllDiaryEntries: ->
#         removeDiaryEntry: (id) ->

#         setPrivacySettings: (settings) ->
#         getPrivacySettings: ->