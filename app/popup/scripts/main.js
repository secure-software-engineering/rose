App = window.App = Ember.Application.create();

App.Router.map(function() {
	this.route("about");
	this.route("backup");
	this.route("diary");
	this.route("documentation");
	this.route("settings");
	this.resource('facebook', function() {
		this.route('interactions');
		this.route('comments');
		this.route('security');
	});
	this.resource('google', function() {
		this.route('interactions');
		this.route('comments');
		this.route('security');
	});
});


// function loadTemplate() {

// }

// function transferTo(page) {
// 	$.ajax({
// 		url: 'templates/' + page + '.hbs'
// 	})
// 		.done(function(hbs) {
// 			var template = Handlebars.compile(hbs);
// 			$('#outlet').html(template());
// 		});
// }

// $(function() {

// 	$('body').on('click', '.ui.menu a.item', function(evt) {
// 		evt.preventDefault();

// 		// Toggle active menu item
// 		$('.ui.menu a.item').filter('.active').removeClass('active');
// 		$(this).addClass('active');

// 		var page = $(this).data('page');
// 		if (page != null) {
// 			transferTo(page);
// 		} else {
// 			console.error("Link has no defined destination.");
// 		}
// 	});

// });