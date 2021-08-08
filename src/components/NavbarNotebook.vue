<template lang="pug">
    q-header.blanco
        q-toolbar(v-if="notebook")
            q-icon.cursor-pointer(name="fas fa-chevron-left" size="md" @click="checkChanges()")
            q-icon.q-ml-xl(:name="'img:'+ `icons/${notebook.icon}.svg`" color="primary" size="md")
            q-toolbar-title {{notebook.title}}
            q-btn.q-mr-sm(flat round dense icon="fas fa-code-branch")
</template>

<script>
const endpoint = "http://206.189.176.175/graphql/";

export default {
  name: "NavbarNotebook",
  props: ["notebook"],
  data() {
    return {
      id: this.$route.params.id
    };
  },
  methods: {
    checkChanges() {
      if (this.$root.$refs.Note.show) {
        this.$root.$refs.Note.saveEditor();
      }
      this.$router.push({ name: "Home" });
    }
  }
};
</script>

<style lang="sass" scoped>
.blanco
    color: black
    background-color: white

.navbarIcon
    font-size: 8px
</style>
