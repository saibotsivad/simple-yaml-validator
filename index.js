var yaml = require('js-yaml')
var parseYaml = yaml.safeLoad

var yamlTypeMap = {
	string: function(input) {
		return typeof input === 'string'
	},
	number: function(input) {
		return typeof input === 'number'
	},
	boolean: function(input) {
		return typeof input === 'boolean'
	},
	binary: function(input) {
		return Buffer.isBuffer(input)
	},
	timestamp: function(input) {
		return input && input instanceof Date
	}
}

function yamlResourceIsValidForYamlSchema(yamlResource, yamlSchema) {
	return jsonResourceIsValidForJsonSchema(parseYaml(yamlResource), parseYaml(yamlSchema))
}

function elementIsValid(schema) {
	return function(element) {
		return jsonResourceIsValidForJsonSchema(element, schema)
	}
}

function jsonResourceIsValidForJsonSchema(jsonResource, jsonSchema) {
	if (Array.isArray(jsonSchema)) {
		if ( !jsonResource ) {
			console.log("No element found matching schema " + jsonSchema)
			return false
		}
		if ( !Array.isArray(jsonResource) ) {
			console.log("Excepted array instead of " + jsonResource)
			return false
		}
		return jsonResource.every(elementIsValid(jsonSchema[0]))
	} else {
		return Object.keys(jsonSchema).every(function (key) {
			if (Array.isArray(jsonSchema[key])) {
				if ( !jsonResource[key] ) {
					console.log("No element found matching schema key '" + key + "'")
					return false
				}
				if ( !Array.isArray(jsonResource[key]) ) {
					console.log("Expected array instead of " + jsonResource[key])
					return false
				}
				return jsonResource[key].every(elementIsValid(jsonSchema[key][0]))
			} else if (typeof jsonSchema[key] === 'object') {
				return jsonResourceIsValidForJsonSchema(jsonResource[key], jsonSchema[key])
			} else {
				if ( !yamlTypeMap[jsonSchema[key]] ) {
					console.log("Unsupported schema type: '" + jsonSchema[key] + "'")
					return false
				}
				if ( !yamlTypeMap[jsonSchema[key]](jsonResource[key]) ) {
					console.log("Invalid value for key '" + key + "': '" + jsonResource[key] + "' (expected: " + jsonSchema[key] + ")")
					return false
				}
				return true
			}
		})
	}
}

module.exports = function resourceValidator(yamlSchema) {
	return function validate(yamlResource) {
		return yamlResourceIsValidForYamlSchema(yamlResource, yamlSchema)
	}
}
