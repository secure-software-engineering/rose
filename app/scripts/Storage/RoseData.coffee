###
ROSE is a browser extension researchers can use to capture in situ 
data on how users actually use the online social network Facebook.
Copyright (C) 2013

    Fraunhofer Institute for Secure Information Technology
    Andreas Poller <andreas.poller@sit.fraunhofer.de>

Authors  

    Oliver Hoffmann <oliverh855@gmail.com>
    Sebastian Ruhleder <sebastian.ruhleder@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
###

class @RoseData
    constructor: (@data) ->
        @initializeMeta()
    
    getData: ->
        @data
    
    initializeMeta: ->
        meta =
            version: '2.0.2'
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
            static: {}
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
            hidden: false
            createdAt: new Date().toJSON()
            record: record
        @getInteractions(platformName).push interaction
    
    getInteraction: (index, platformName) ->
        for interaction in @getInteractions(platformName)
            return interaction if interaction['index'] == index
        return null
    
    removeInteraction: (index, platformName) ->
        interactions = @getInteractions(platformName).map (interaction) ->
            if interaction['index'] is index
                interaction.deleted = true
                interaction.record = null
            return interaction
        @setInteractions(interactions, platformName)

    hideInteraction: (index, hide, platformName) ->
        interactions = @getInteractions(platformName).map (interaction) ->
            if interaction['index'] is index
                interaction.hidden = hide
            return interaction
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
            hidden: false
            createdAt: new Date().toJSON()
            record: record
        @getComments(platformName).push comment

    getComment: (index, platformName) ->
        for comment in @getComments(platformName)
            return comment if comment['index'] is index
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
            createdAt: new Date().toJSON()
            content: content
        @getDiaryEntries().push entry
    
    removeDiaryEntry: (index) ->
        entries = @getDiaryEntries().filter (entry) ->
            entry['index'] isnt index
        @setDiaryEntries(entries)

    updateDiaryEntry: (index, text) ->
        entries = @getDiaryEntries().map (entry) ->
            if entry['index'] is index
                entry.content = text
            return entry

        @setDiaryEntries(entries)
    
    setDiaryEntries: (entries) ->
        @data['diary'] = entries
    
    getDiaryEntries: ->
        return @data['diary']
    
    getStaticInformation: (platformName) ->
        @addPlatform(platformName) unless @hasPlatform(platformName)
        for platform in @data['platforms']
            return platform['static'] if platform['name'] is platformName
        return null
    
    getStaticInformationEntry: (platformName, informationName) ->
        @addPlatform(platformName) unless @hasPlatform(platformName)
        for platform in @data['platforms']
            if platform['name'] is platformName and platform['static'].hasKey(informationName)
                return platform['static']['informationName']
        return null
    
    setStaticInformationEntry: (entry, platformName, informationName) ->
        @addPlatform(platformName) unless @hasPlatform(platformName)
        for platform in @data['platforms']
            platform['static'][informationName] = entry if platform['name'] is platformName
 