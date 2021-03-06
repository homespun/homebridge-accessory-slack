/* jshint asi: true, node: true, laxbreak: true, laxcomma: true, undef: true, unused: true */

var Slack      = require('node-slack')
  , path       = require('path')
  , underscore = require('underscore')
  , url        = require('url')
  , util       = require('util')

module.exports = function (homebridge) {
  var Characteristic = homebridge.hap.Characteristic
    , Service = homebridge.hap.Service
    , CommunityTypes = require('hap-nodejs-community-types')(homebridge)

  homebridge.registerAccessory("homebridge-accessory-slack", "slack", SlackAccessory)

  function SlackAccessory(log, config) {
    if (!(this instanceof SlackAccessory)) return new SlackAccessory(log, config)

    this.log = log
    this.config = config || { accessory: 'slack' }
    if ((!this.config.webhook) || (!this.config.codes)) throw new Error('Missing configuration')

    if (typeof this.config.codes === 'string') this.config.codes = [ this.config.codes ]
    else if (!util.isArray(this.config.codes)) throw new Error('Invalid configuration')

    this.label = this.config.accessory
    this.name = this.config.name
    this.slack = new Slack(this.config.webhook)
    this.stateValue = this.config.codes.length
    this.stateTime = Math.round(underscore.now() / 1000)
  }

  SlackAccessory.prototype =
  { getNotificationCode:
    function (callback) {
      callback(null, this.stateValue)
    }

  , setNotificationCode:
    function (value, callback) {
      var text = this.config.codes[value]
      
      if (text) {
        this.stateValue = value
        this.stateTime = Math.round(underscore.now() / 1000)
        this._slackSend()
      }

      callback()
    }

  , getNotificationText:
    function (callback) {
      callback(null, this.config.codes[this.stateValue] || '')
    }

  , getLastEventTime:
    function (callback) {
      callback(null, this.stateTime)
    }

  , _slack:
    function () {
      var self = this

      self.slack.send({ icon_url : self.config.icon_url || self.icon_url
                      , text     : self.config.codes[self.stateValue]
                      }, function (unknown, err, body) {/* jshint unused: false */
                        if ((!err) || (err.message === 'ok')) return
                        
                        self.log.error('send', { text: self.config.codes[self.stateValue] , diagnostic: err.toString() })
                      })
    }

  , getServices:
    function () {
      var comps, parts
      
      require('pkginfo')(module, [ 'author', 'repository', 'version' ])
      if ((module.exports.repository) && (module.exports.repository.url)) {
        parts = url.parse(module.exports.repository.url)
        if ((parts.protocol === 'git:') && (parts.hostname === 'github.com')) {
          comps = path.parse(parts.pathname)
          this.icon_url = url.format({ protocol: 'https:'
                                     , hostname: 'raw.githubusercontent.com'
                                     , pathname: path.join(comps.dir, comps.name, 'master', 'icon_url.png')
                                     })
        }
      }
      this._slackSend = underscore.debounce(this._slack, 250)

      this.service = new CommunityTypes.NotificationService("Notifications")

      this.accessoryInformation = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Name, this.name)
        .setCharacteristic(Characteristic.Manufacturer, module.exports.author.name)
        .setCharacteristic(Characteristic.Model, this.label)
        .setCharacteristic(Characteristic.SerialNumber, 'Version ' + module.exports.version);

      this.service
        .getCharacteristic(CommunityTypes.NotificationCode)
        .on('get', this.getNotificationCode.bind(this))
        .on('set', this.setNotificationCode.bind(this))
        .setProps({ maxValue: this.config.codes.length - 1})
      this.service
        .getCharacteristic(CommunityTypes.NotificationText)
        .on('get', this.getNotificationText.bind(this))

      this.service
        .getCharacteristic(CommunityTypes.LastEventTime)
        .on('get', this.getLastEventTime.bind(this))

      return [ this.accessoryInformation, this.service ]
    }
  }
}
