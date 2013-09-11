require 'Storage/RoseData'

class @Storage
    @addPlatform: (platformName) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            roseData = new RoseData(roseStorage)
            
            roseData.addPlatform(platformName)
            
            kango.invokeAsync 'kango.storage.setItem', 'roseStorage', roseData.getData()
    
    @hasPlatform: (platformName, callback) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            roseData = new RoseData(roseStorage)
            
            hasPlatform = roseData.hasPlatform(platformName)
            
            callback(hasPlatform)
    
    @addInteraction: (record, platformName) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            roseData = new RoseData(roseStorage)
            
            roseData.addInteraction(record, platformName)
            
            kango.invokeAsync 'kango.storage.setItem', 'roseStorage', roseData.getData()

    @getInteraction: (index, platformName, callback) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            roseData = new RoseData(roseStorage)
            
            interaction = roseData.getInteraction(index, platformName)
            
            callback(interaction)

    @getInteractions: (platformName, callback) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            roseData = new RoseData(roseStorage)
            
            interactions = roseData.getInteractions(platformName)
            
            callback(interactions)

    @removeInteraction: (index, platformName) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            roseData = new RoseData(roseStorage)
            
            roseData.removeInteraction(index, platformName)
            
            kango.invokeAsync 'kango.storage.setItem', 'roseStorage', roseData.getData()

    @addComment: (comment, platformName) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            roseData = new RoseData(roseStorage)
            
            roseData.addComment(comment, platformName)
            
            kango.invokeAsync 'kango.storage.setItem', 'roseStorage', roseData.getData()

    @getComment: (index, platformName, callback) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            roseData = new RoseData(roseStorage)
            
            comment = roseData.getComment(index, platformName)
            
            callback(comment)

    @getComments: (platformName, callback) ->
            roseData = new RoseData(roseStorage)
            
            comments = roseData.getComments(platformName)
            
            callback(comments)

    @removeComment: (index, platformName) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            roseData = new RoseData(roseStorage)
            
            roseData.removeComment(index, platformName)
            
            kango.invokeAsync 'kango.storage.setItem', 'roseStorage', roseData.getData()

    @addDiaryEntry: (entry) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            roseData = new RoseData(roseStorage)
            
            roseData.addDiaryEntry(entry)
            
            kango.invokeAsync 'kango.storage.setItem', 'roseStorage', roseData.getData()
    
    @removeDiaryEntry: (index) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            roseData = new RoseData(roseStorage)
            
            roseData.removeDiaryEntry(index)
            
            kango.invokeAsync 'kango.storage.setItem', 'roseStorage', roseData.getData()

    @getDiaryEntries: (callback) ->
            roseData = new RoseData(roseStorage)
            
            entries = roseData.getDiaryEntries()
            
            callback(entries)
    
    @getPrivacyEntry: (platformName, callback) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            roseData = new RoseData(roseStorage)
            
            entry = roseData.getPrivacyEntry(platformName)
            
            callback(entry)
    
    @setPrivacyEntry: (entry, platformName) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            roseData = new RoseData(roseStorage)
            
            roseData.setPrivacyEntry(entry, platformName)
            
            kango.invokeAsync 'kango.storage.setItem', 'roseStorage', roseData.getData()
    
    @getMetaInformation: (callback) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            roseData = new RoseData(roseStorage)
            
            meta = roseData.getMeta()
            
            callback(meta)
    
    @setMetaInformation: (meta) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            roseData = new RoseData(roseStorage)
            
            roseData.setPrivacyEntry(entry, platformName)
            
            kango.invokeAsync 'kango.storage.setItem', 'roseStorage', roseData.getData()
    
    @appendMetaInformation: (meta) ->
        kango.invokeAsync 'kango.storage.getItem', 'roseStorage', (roseStorage) ->
            roseData = new RoseData(roseStorage)
            
            roseData.setMeta(meta)
            
            kango.invokeAsync 'kango.storage.setItem', 'roseStorage', roseData.getData()
