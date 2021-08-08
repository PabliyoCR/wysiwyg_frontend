<template lang="pug">
  q-page-container
    NavbarNotebook(:notebook="notebook")
    Notebook(v-if="notebook" :sectionsOrder="notebook.sectionsOrder")
</template>

<script>
import NavbarNotebook from "@/components/NavbarNotebook.vue";
import Notebook from "@/components/Notebook.vue";
import axios from "axios";

const endpoint = "http://206.189.176.175/graphql/";

export default {
  name: "NotebookView",
  components: { NavbarNotebook, Notebook },
  data() {
    return {
      notebook: null,
      id: this.$route.params.id
    };
  },
  methods: {
    async getNotebook() {
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `{
                    notebook(id:"${this.id}"){
                        id
                        title
                        icon
                        sectionsOrder
                    }
                }`
        }
      })
        .then(result => {
          this.notebook = result.data.data.notebook;
        })
        .catch(error => {
          alert("Error");
          console.error(error);
        });
    }
  },
  mounted() {
    this.getNotebook();
  }
};
</script>

<style lang="scss" scoped></style>
