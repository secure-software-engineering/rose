class @RoseData
    constructor: (@data) ->
        @initializeMeta()
    
    getData: ->
        @data
    
    initializeMeta: ->
        meta =
            version: '2.0.1'
        @data['meta'] = meta if @data['meta'] == undefined
    
    appendMeta: (meta) ->
        @initializeMeta()
        for key, value of meta
            @data['meta'][key] = value
    
    setMeta: (meta) ->
        @data['meta'] = meta
    
    getMeta: ->
        @data['meta']
    
    addPlatform: (platformName) ->
        platform =
            name: platformName
            interactions: []
            comments: []
            privacy: {}
        @data['platforms'].push platform
    
    hasPlatform: (platformName) ->
        for platform in @data['platforms']
            return true if platform['name'] == platformName
        return false
    
    addInteraction: (record, platformName) ->
        index = @getInteractions(platformName).length
        interaction =
            index: index
            deleted: false
            createdAt: new Date()
            record: record
        @getInteractions(platformName).push interaction
    
    getInteraction: (index, platformName) ->
        for interaction in @getInteractions(platformName)
            return interaction if interaction['index'] == index
        return null
    
    removeInteraction: (index, platformName) ->
        interactions = @getInteractions(platformName).filter (interaction) ->
            interaction['index'] isnt index
        @setInteractions(interactions, platformName)
    
    setInteractions: (interactions, platformName) ->
        @addPlatform(platformName) unless @hasPlatform(platformName)
        for platform in @data['platforms']
            platform['interactions'] = interactions if platform['name'] == platformName
        
    getInteractions: (platformName) ->
        @addPlatform(platformName) unless @hasPlatform(platformName)
        for platform in @data['platforms']
            return platform['interactions'] if platform['name'] == platformName
        return null
    
    addComment: (record, platformName) ->
        index = @getComments(platformName).length
        comment =
            index: index
            deleted: false
            createdAt: new Date()
            record: record
        @getComments(platformName).push comment

    getComment: (index, platformName) ->
        for comment in @getComments(platformName)
            return comment if comment['index'] == index
        return null
    
    removeComment: (index, platformName) ->
        comments = @getComments(platformName).filter (comment) ->
            comment['index'] isnt index
        @setComments(comments, platformName)
    
    setComments: (comments, platformName) ->
        @addPlatform(platformName) unless @hasPlatform(platformName)
        for platform in @data['platforms']
            platform['comments'] = comments if platform['name'] == platformName
        
    getComments: (platformName) ->
        @addPlatform(platformName) unless @hasPlatform(platformName)
        for platform in @data['platforms']
            return platform['comments'] if platform['name'] == platformName
        return null
    
    hasDiary: ->
        return @data['diary'] != undefined
    
    addDiary: ->
        @data['diary'] = []
    
    addDiaryEntry: (content) ->
        @addDiary() unless @hasDiary()
        index = @getDiaryEntries().length
        entry =
            index: index
            createdAt: new Date()
            content: content
        @getDiaryEntries().push entry
    
    removeDiaryEntry: (index) ->
        entries = @getDiaryEntries().filter (entry) ->
            entry['index'] isnt index
        @setDiaryEntries(entries, platformName)
    
    setDiaryEntries: (entries) ->
        @data['diary'] = entries
    
    getDiaryEntries: ->
        return @data['diary']
    
    getPrivacyEntry: (platformName) ->
        @addPlatform(platformName) unless @hasPlatform(platformName)
        for platform in @data['platforms']
            return platform['privacy'] if platform['name'] == platformName
        return null
    
    setPrivacyEntry: (entry, platformName) ->
        @addPlatform(platformName) unless @hasPlatform(platformName)
        for platform in @data['platforms']
           platform['privacy'] = entry if platform['name'] == platformName
 