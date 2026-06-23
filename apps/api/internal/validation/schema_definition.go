package validation

import "encoding/json"

func ValidateSchemaDefinition(schemaJSON json.RawMessage) error {
	schema, err := parseJSONSchema(schemaJSON)
	if err != nil {
		return err
	}
	for field, property := range schema.Properties {
		if _, err := compileFieldValidator(property, schema.isRequired(field)); err != nil {
			return err
		}
	}
	return nil
}
