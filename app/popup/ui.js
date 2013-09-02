function prepareTemplate(pageName, callback, parameters) {
    $.ajax({
        url: './pages/' + pageName,
        dataType: 'text'
    }).success(function(data, textStatus, jqXHR) {
        // Create templating function.
        var templating = doT.template(data);

        // Execute callback.
        callback(templating, parameters);
    });
}

function loadPage(pageName, targetContainer, parameters) {
    prepareTemplate(pageName, function(templating) {
        // Fill in parameters.
        var result = templating(parameters);

        // Insert result into content field.
        $(targetContainer).html(result).i18n();
    });
}

function initInternationalization() {
    // Initialize i18next with local language map.
    $.i18n.init({
        lng: 'en',
        ns: {
            namespaces: ['common'],
            defaultNs: 'common'
        },
        resStore: languageMap()
    });
}

function populateNavigation() {
    // Try to initialize Management.
    Management.initialize();

    // Get list of available networks.
    var listOfNetworks = Management.getListOfNetworks();

    // Traverse through networks.
    for (var i in listOfNetworks) {
        var network = listOfNetworks[i];

        // Get network name.
        var networkName = network.getNetworkName();

        // Prepare navigation template.
        prepareTemplate('_navigation_network.html', function(templating, parameters) {
            // Fill in information.
            var networkNavigationEntry = templating({
                networkName: parameters['network']
            });

            // Add to navigation.
            $("#rose-navigation").append(networkNavigationEntry).i18n();
        }, {
            "network": networkName
        });
    }

    // Fill in navigation.
    //navigation.html(container);
}

function registerHandlers() {
    // Register navigation handler.
    $(document).on("click", function(node) {
        // Reset class.
        $(this).removeClass("navigation-link");
        $(this).addClass("navigation-link-integrated");

        // Get link object.
        var link = $(node.target);

        // Get action.
        var action = link.attr("action");

        // Manage actions.
        switch (action) {
            case "interactions":
                prepareTemplate("_interactions.html", function(templating, parameters) {
                    console.log('load interactions page');
                    // Get interactions for network.
                    var networkInteractions = Storage.getInteractions(parameters["network"], function(networkInteractions) {
                        // Fill in information.
                        var interactionsPage = templating({
                            'interactions': networkInteractions,
                            'networkName': parameters["network"]
                        });

                        // Show page.
                        $("#rose-content-field").html(interactionsPage).i18n();
                    });
                }, {
                    "network": link.attr("network-name")
                });
                break;
            case "comments":
                prepareTemplate("_comments.html", function(templating, parameters) {
                    // Get comments for network.
                    var networkComments = Storage.getComments(parameters["network"], function(networkComments) {
                        // Fill in information.
                        var commentsPage = templating({
                            'comments': networkComments,
                            'networkName': parameters["network"]
                        });

                        // Show page.
                        $("#rose-content-field").html(commentsPage).i18n();
                    });
                }, {
                    "network": link.attr("network-name")
                });
                break;
            case "diary":
                prepareTemplate("_diary.html", function(templating, parameters) {
                    // Get diary entries.
                    var diaryEntries = Storage.getDiary(function(diaryEntries) {
                        // Fill in information.
                        var diaryPage = templating({
                            'diaryEntries': diaryEntries
                        });

                        // Show page.
                        $("#rose-content-field").html(diaryPage).i18n();
                    });
                }, {});
                break;
            case "privacy":
                prepareTemplate("_privacy.html", function(templating, parameters) {
                    // Get privacy entries.
                    var privacyEntry = Storage.getPrivacyEntry(parameters["network"], function(privacyEntry) {
                        // Fill in information.
                        var privacyPage = templating({
                            'privacyEntry': privacyEntry,
                            'networkName': parameters["network"]
                        });

                        // Show page.
                        $("#rose-content-field").html(privacyPage).i18n();
                    });
                }, {
                    "network": link.attr("network-name")
                });
                break;
            case "page":
                prepareTemplate("page.html", function(templating, parameters) {
                    // Template page.
                    var page = templating(parameters);

                    // Show page.
                    $("#rose-content-field").html(page).find("#page-container").html($.t("pages." + parameters['page-name']));
                }, {
                    'page-name': link.attr("page-name")
                });
                break;
        }
    });
}

/*
 * SETUP
 */
$(document).ready(function() {
    // Initialize i18next.
    initInternationalization();

    // Populate sidebar navigation.
    populateNavigation();

    // Register handlers.
    registerHandlers();
});