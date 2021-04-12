#!/bin/bash
# Build web clients from all default configs of actor-init-sparql-link-traversal

cwd=$(pwd)
mkdir -p $cwd/web-clients/builds
pushd packages/actor-init-sparql-link-traversal >/dev/null
for config in config/*.json; do
  id=$(echo $config | sed "s/config\/config-\(.*\)\.json/\1/")

  cat $cwd/web-clients/settings.json | \
    sed "s/__SUBTITLE__/Using $id config/; s~__SUBTITLE_HREF__~https://github.com/comunica/comunica-feature-link-traversal/blob/master/packages/actor-init-sparql-link-traversal/config/config-$id.json~" \
    > $cwd/web-clients/settings.custom.json

  # Build web client
  echo -e "\033[1m\033[34mBuilding config $id\033[0m"
  $cwd/node_modules/@comunica/web-client-generator/bin/generate.js $config \
    -d $cwd/web-clients/builds/$id \
    -s $cwd/web-clients/settings.custom.json \
    -q $cwd/web-clients/queries

  rm $cwd/web-clients/settings.custom.json
done
popd >/dev/null

# Copy build index file
cp $cwd/web-clients/overview.html $cwd/web-clients/builds/index.html
