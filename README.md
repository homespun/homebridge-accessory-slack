# homebridge-accessory-slack
A [slack](https://slack.com) accessory plugin for [Homebridge](https://github.com/nfarina/homebridge).

# Installation
Run these commands:

    % sudo npm install -g homebridge
    % sudo npm install -g homebridge-accessory-slack

On Linux, you might see this output for the second command:

    npm ERR! pcap2@3.0.4 install: node-gyp rebuild
    npm ERR! Exit status 1
    npm ERR!

If so, please try

    % apt-get install libpcap-dev

and try

    % sudo npm install -g homebridge-accessory-slack

again!

# Configuration
Edit `~/.homebridge/config`, inside `"accessories": [ ... ]` add:

    { "accessory"    : "slack"
    , "name"         : "Slack Notifications"
    , "webhook"      : "https://"
    , "codes"        : [ "Motion detected" ]
    , "channel"      : "#homekit"
    , "username"     : "homekit"
    }

To create an incoming `webhook` for [slack](https://slack.com),
go to

        https://...slack.com/apps/A0F7XDUAZ-incoming-webhooks

and click on "Add Configuration".

The `channel` and `username` properties are optional.
The `codes` array must contain at least one text string.
