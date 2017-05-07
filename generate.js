// Download the current CloudFormation schema from AWS and
// create a bunch of yasnippet snippet files that will be loaded
// when json-mode is enabled.
//
// Author: Rusty Conover (rusty@luckydinosaur.com)
// (C) Copyright 2017 Lucky Dinosaur LLC.
//

const fs = require('fs');
const _ = require('lodash');
const request = require('request');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');

rimraf.sync('snippets');
mkdirp.sync('snippets/json-mode/cloudformation');
request(
  {
    url: 'https://dnwj8swjjbsbt.cloudfront.net/latest/CloudFormationResourceSpecification.json',
    encoding: 'utf8',
    gzip: true,
    json: true,
  },
  (err, res, schema) => {
    if (err) {
      throw err;
    }

    fs.writeFileSync('snippets/json-mode/.yas-make-groups', '', 'utf8');

    _.mapValues(schema.ResourceTypes, (v, key) => {
      const snippetName = key
            .replace(/::/g, '_')
            .replace(/^AWS_/, '')
            .toLowerCase();

      let snippet = `# -*- mode: snippet -*-
# name: ${snippetName}
# key: ${snippetName}
# --
`;

      let resolveProp;
      const expressType = (parent, subtype, prop) => {
        if (subtype === 'String') {
          return '';
        } else if (subtype === 'Boolean') {
          return true;
        } else if (subtype === 'Integer' || subtype === 'Long') {
          return 0;
        } else if (subtype === 'Timestamp') {
          return '000-00-20T00:00:00';
        } else if (subtype === 'Double') {
          return 0.0;
        } else if (subtype === 'Configuration') {
          return {};
        } else if (subtype === 'Map') {
          return { Key: expressType(parent, prop.PrimitiveItemType || prop.ItemType, prop) };
        } else if (subtype === 'Json') {
          return {};
        } else if (subtype === 'SourceConfiguration') {
          return '';
        } else if (subtype === 'List') {
          return [expressType(parent, prop.PrimitiveItemType || prop.ItemType, prop)];
        }
        const src = schema.PropertyTypes[`${parent}.${subtype}`] ||
                schema.ResourceTypes[`${parent}.${subtype}`]
                || schema.ResourceTypes[`${subtype}`]
                || schema.PropertyTypes[`${subtype}`];
        if (src == null) {
          throw new Error(`Did not find2 parent=${key} sub=${subtype} ${JSON.stringify(prop, null, 2)}`);
        }
        return _.mapValues(src.Properties, resolveProp);
      };

      resolveProp = (prop) => {
        if (prop.PrimitiveType) {
          return expressType(key, prop.PrimitiveType, prop);
        } else if (prop.Type) {
          return expressType(key, prop.Type, prop);
        } else if (prop.ItemType) {
          return expressType(key, prop.ItemType, prop);
        }
        throw new Error(`Do not know how to handle prop ${JSON.stringify(prop, null, 2)}`);
      };

      const props = {
        Type: key,
        Properties: _.mapValues(v.Properties, resolveProp),
      };

      snippet += JSON.stringify(props, null, 2);

      fs.writeFileSync(`snippets/json-mode/cloudformation/${snippetName}`, snippet, 'utf8');
    });

    // Now that all of the types have been expressed, create some snippets for functions.


    fs.writeFileSync('snippets/json-mode/cloudformation/fn_sub', `# -*- mode: snippet -*-
# name: fn_sub
# key: fn_sub
# --
{ "Fn::Sub": [$1, { "$2": $3 } ]}
`);

    fs.writeFileSync('snippets/json-mode/cloudformation/fn_join', `# -*- mode: snippet -*-
# name: fn_join
# key: fn_join
# --
{ "Fn::Join": [$1, [ "$2", $3 ]] }
`);

    fs.writeFileSync('snippets/json-mode/cloudformation/ref', `# -*- mode: snippet -*-
# name: ref
# key: ref
# --
{ "Ref": "$1" }
`);

    fs.writeFileSync('snippets/json-mode/cloudformation/fn_getatt', `# -*- mode: snippet -*-
# name: fn_getatt
# key: fn_getatt
# --
{ "Fn::GetAtt": ["$1", "$2"] }
`);


  });
