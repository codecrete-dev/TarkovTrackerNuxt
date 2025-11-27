<template>
  <div class="py-1">
    <div class="p-1 rounded-lg bg-gray-800 border border-gray-700">
      <div
        v-for="(keyMap, keyMapIndex) in neededKeys"
        :key="keyMapIndex"
        class="flex items-center my-1"
      >
        <i18n-t
          keypath="page.tasks.questcard.keysneeded"
          :plural="keyMap.keys.length"
          scope="global"
        >
          <template #keys>
            <span
              v-for="(key, keyIndex) in keyMap.keys"
              :key="keyIndex"
              class="inline-block"
            >
              <GameItem
                :item-id="key.id"
                :item-name="key.shortName"
                :dev-link="key.link"
                :wiki-link="key.wikiLink"
                :count="1"
                class="mr-2"
              />
            </span>
          </template>
          <template #map>
            {{ keyMap.map.name }}
          </template>
        </i18n-t>
      </div>
    </div>
  </div>
</template>
<script setup>
defineProps({
  neededKeys: { type: Array, required: true },
});
</script>
