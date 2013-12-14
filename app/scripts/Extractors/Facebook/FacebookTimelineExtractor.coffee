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

class @FacebookTimelineExtractor
    getNetworkName: ->
        "Facebook"

    getExtractorName: ->
        "timeline-settings"

    extractInformation: ->
        # Set information URL.
        informationUrl = "https://www.facebook.com/settings/?tab=timeline"

        # Set network name.
        networkName = @getNetworkName()

        # Set extractor name.
        extractorName = @getExtractorName()

        # Retrieve information.
        $.get informationUrl, (data) ->
            # Wrap data.
            $data = $(data)

            # Initialize entry.
            entry = {}

            # Extract information.
            $data.find(".fbSettingsSectionsItem").each () ->
                # Get section name.
                section = $(this).find(".fbSettingsSectionsItemName").html()

                # Initialize section in entry.
                entry[section] = {}

                # Get items.
                $(this).find(".fbSettingsListItemContent").each () ->
                    # Get key.
                    key = $(this).find("div:nth-child(1)").html()

                    # Get value.
                    value = $(this).find("div:nth-child(2)").html()

                    # Set entry.
                    entry[section][key] = value

            # Write entry to storage.
            Storage.addStaticInformationEntry entry, networkName, extractorName
