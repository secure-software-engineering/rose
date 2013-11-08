/*
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
*/

/*
 * Returns language map for ROSE UI.
 */
function languageMap() {
	return {
		en: {
			common: {
				'navigation': {
					'interactions': 'Interactions',
					'comments': 'Comments',
					'diary': 'Diary',
					'home': 'Home',
					'backup': 'Backup',
					'help': 'Help',
					'about': 'About',
					'privacy': 'Privacy Settings'
				},
				'interactions': {
					'interaction': 'Interaction',
					'date': 'Date',
					'object-owner': 'Object Owner',
					'object-type': 'Object Type',
					'interaction-type': 'Interaction Type',

					/* Interaction Types */
					'updatestatus': 'Status post creation',
					'updatestatuspicture': 'Image status post creation',
					'like': 'Story item liking',
					'unlike': 'Revocation of story item like',
					'deletecomment': 'Story item comment deletion',
					'commentstatus': 'Creation of a comment on a story item',
					'share': 'Story item sharing',
					'deletestatus': 'Story item deletion',
					'unfriend': 'Friendship revocation',
					'openfacebook': 'Opening Facebook',
					'closefacebook': 'Closing Facebook',
					'friendaccepted': 'Friend request accepted',
					'friendignored': 'Friend request ignored',
					'friendadded': 'Friend request send',
					'chatturnoff': 'Chat turned off',
					'chatactivated': 'Chat activated',
					'chat': 'Chat message',
					'hideactivity': 'Hide status'
				},
				'pages': {
					'help': '<h1>Help</h1><hr /><p>Here we answer frequently asked questions for ROSE.</p><hr /><h4>Where does ROSE collect the data about my Facebook usage and my inserted comments?</h4><br /><p>Rose exclusively collects data in your web browser. ROSE can provide a pre-assembled Mail which you can use to transmit your data to the study advisor. ROSE does not transmit data to Facebook; Facebook can not detect your usage of ROSE with their computer systems. ROSE neither transmits data itself to the study advisor nor receives them.</p><p>There is a disadvantage of this privacy aware concept of ROSE, though: ROSE data can be lost in case system bugs emerge on your computer. With the deletion of ROSE from your web browser all stored data is irretrievably lost.</p><hr /><h4>Are my ROSE study comments visible for other study participants or Facebook users?</h4><br /><p>No, this is impossible for technical reasons. The distribution and therefore visibility for other study participants or Facebook users is impossible because ROSE does not transmit data to Facebook computer systems or to the study advisory. ROSE does not receive data either. Furthermore, Facebook can not even find out about whether you are using ROSE or not.Even though ROSE has a close integration in your web browser and the Facebook interface and therefore is much alike to the &quot;real&quot; Facebook functions this &quot;illusion of an extended Facebook&quot; completely and exclusively takes place in your web browser with ROSE.</p><hr /><h4>Which data is being recorded by ROSE?</h4><br /><p>ROSE records the following data:</p><ul><li><b>Date and time of interactions in Facebook</b>, e.g., the time the study participant publishes a story item on his/her Timeline.</li><li><b>Type of interaction</b>, e.g., &quot;creating a story item&quot;.</li> <li><b>Unique identifiers</b>, which mark the context of interactions. Identifiers are an eight-digit combination of letters and numbers, e.g., &quot;2a2d6fc3&quot;. With commenting on a picture the identifiers correspond to the picture you commented on. Thereby the study advisory can detect if multiple study participants commented on the same picture without ever learning about the content of this picture.</li> <li><b>Privacy settings concerning interactions</b>, e.g. whether a story item is visible for &quot;Friends&quot; only or for &quot;Everyone&quot;.</li> <li><b>Diary entries.</b></li> <li><b>ROSE study comments.</b></li> <li><b>Privacy settings in general.</b></li></ul><hr /><h4>Does ROSE collect data which I am sharing with my friends on Facebook?</h4><br /><p>No. ROSE does not collect any data which you are sharing with your friends on Facebook. ROSE does not collect any content-related information, e.g., pictures, links, messages on Timelines, chat messages, or the names of groups you attended.ROSE only collects data about the usage of a type of action, e.g. if you are commenting on a picture. In the analysis the study advisors are only able to see that you made use of an action. The study advisors only asses that you made use of a type of action, but does not see if you are commenting on a picture of a polar bear or if you are commenting on a picture showing a friend of yours who is at a party. If you like to record information on the content of an action in order to explain why you made use of a specific action, please use the ROSE comments or your diary. </p><hr /><h4>How do I control which interaction data ROSE collected?</h4><br /><p>You may easily check this by using the user interface (menu item &quot;interaction tracking&quot;).Moreover you may read which data was collected by ROSE, when you are transferring your data to the study advisors. Even though it is a compact text-based data format, you may easily check that no personal data is transmitted.</p><hr /><h4>How can I be sure that ROSE makes my data anonymous?</h4><br /><p>ROSE data does not contain any information which refers to the Facebook user who created this data. ROSE does not save any Facebook user names or pictures’ and videos’ URLs provided by users. Thus ROSE data does not differ from ethnographically elicited and anonymised data, such as interviews. Anyways, saving content-related information would no be very sufficient as it does no allow contextual analysis</p><hr /><h4>May I review the source code to check previous declarations?</h4><br /><p>Yes. ROSE is a free, open-source software under GPL-license (General Public License). You may review the source code and you may change and process it on the conditions of the GPL. In favor of needing assistance, please contact the study advisors.</p><hr /><h4>May I use ROSE for personal purposes after the study ended?</h4><br /><p>Yes. You may continue using ROSE and process it without hesitation as it does not send any information to the study advisors automatically. Thereto please note the GPL license’s conditions. However, after the study ended we are not able to endorse you by using the software, e.g. providing ROSE updates.</p>',
					'about': '<h1> About ROSE</h1><hr/><p> ROSE is a browser extension to support empirical Field studies by recording users&apos; interactions with the social network Facebook for a limited period of time. Please consider the help page for further information on ROSE&apos;s functioning. </p><hr/><p> ROSE has been developed by </p><address><strong>Fraunhofer Institute for Secure Information Technology SIT</strong><br/> Rheinstrasse 75<br/> 64295 Darmstadt<br/> Germany </address><p> For questions about ROSE feel free to contact <a href="mailto:andreas.poller@sit.fraunhofer.de">Andreas Poller, andreas.poller@sit.fraunhofer.de</a></p><p> This program is free software;you can redistribute it and/or modify it under the terms of the GNU General Public License version as published by the Free Software Foundation;either version 3 of the License, or (at your option) any later version. </p><p> Version: <span id="versionInformation"></span></p>',
					'backup': '<h1> Backup and Restore </h1><hr/><p> On this page, you can back up your ROSE study data or restore it from a previously created backup. </p><p> For creating a new backup, simply click on "Backup" and save the data appearing in the text box into a file on your local computer. </p><p> For restoring an existing backup, paste your data into the text box and click on the "Restore" button. </p><p id="backup-error" class="alert alert-error" style="display: none;"></p><p><textarea id="txtBackup" class="span11" rows="10" cols="80"></textarea></p><p><input type="button" value="Backup" id="btnBackup" class="btn"/>  <input type="button" value="Restore" id="btnRestore" class="btn"/>  <input type="button" value="Send via E-mail" id="btnSendMail" class="btn"/>  <input type="button" class="btn" id="btnCancelBackup" value="Clear Field"/></p>'
				},
				'privacy': {
					'field': 'Field',
					'description': 'Description',
					'content': 'Content'
				},
				'headings': {
					'privacy-caption': 'Privacy information for',
					'interactions-caption': 'Interactions for',
					'comments-caption': 'Comments for',
					'diary-caption': 'Diary Entries'
				}
			}
		}
	};
}