/* jshint asi: true, node: true, laxbreak: true, laxcomma: true, undef: true, unused: true */

var Slack = require('node-slack')
  , util  = require('util')

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
    this.stateValue = 0
  }

  SlackAccessory.prototype =
  { getState:
    function (callback) {
      callback(null, this.stateValue)
    }

  , setState:
    function (value, callback) {
      var text = this.config.codes[text]
      
      if (text) {
        this.stateValue = value

        this.slack.send({ channel  : this.config.channel || '#homekit'
                        , username : this.config.channel || 'homekit'
                        , icon_url : this.config.icon_url
                        , text     : text
                        })
      }

      callback()
    }

  , getServices:
    function () {
      require('pkginfo')(module)

      this.service = new CommunityTypes.NotificationService("Notifications")

      this.accessoryInformation = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Name, this.name)
        .setCharacteristic(Characteristic.Manufacturer, module.exports.author.name)
        .setCharacteristic(Characteristic.Model, this.label)
        .setCharacteristic(Characteristic.SerialNumber, 'Version ' + module.exports.version);

      this.service
        .getCharacteristic(CommunityTypes.NotificationText)
        .on('get', this.getState.bind(this))
        .on('set', this.setState.bind(this))

      this.service.setCharacteristic(CommunityTypes.NotificationText, this.stateValue)

      return [ this.accessoryInformation, this.service ]
    }
  }
}
