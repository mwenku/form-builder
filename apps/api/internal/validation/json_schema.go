package validation

type JSONSchema struct {
	Type                 string                        `json:"type"`
	Required             []string                      `json:"required"`
	Properties           map[string]JSONSchemaProperty `json:"properties"`
	AdditionalProperties *bool                         `json:"additionalProperties"`
}

type JSONSchemaProperty struct {
	Type       string   `json:"type"`
	Format     string   `json:"format"`
	Enum       []string `json:"enum"`
	MinLength  *int     `json:"minLength"`
	MaxLength  *int     `json:"maxLength"`
	Minimum    *float64 `json:"minimum"`
	Maximum    *float64 `json:"maximum"`
	MultipleOf *float64 `json:"multipleOf"`
	Pattern    string   `json:"pattern"`
}

func parseJSONSchema(raw []byte) (*JSONSchema, error) {
	var schema JSONSchema
	if err := unmarshalJSON(raw, &schema); err != nil {
		return nil, err
	}
	if schema.Type != "object" {
		return nil, errUnsupportedSchemaType
	}
	if schema.Properties == nil {
		schema.Properties = map[string]JSONSchemaProperty{}
	}
	return &schema, nil
}

func (s *JSONSchema) rejectsAdditionalProperties() bool {
	if s.AdditionalProperties == nil {
		return false
	}
	return !*s.AdditionalProperties
}

func (s *JSONSchema) isRequired(field string) bool {
	for _, name := range s.Required {
		if name == field {
			return true
		}
	}
	return false
}
