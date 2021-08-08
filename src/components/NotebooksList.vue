<template lang="pug">
  q-layout
    q-page-container
      q-page
        .q-px-xl.q-py-md.window-height.window-width.justify-center.items-center
          .row
            .title Wysiwyg Notes
          .row
            router-link.styless(v-for="notebook in notebooks" :to="{ name: 'NotebookView', params: { id: notebook.node.id }}" :key="notebook.node.id")
              q-card.cursor-pointer.q-hoverable.q-ma-sm(v-if="getItemVisibility(notebook.node.category.id)" flat bordered v-ripple)
                q-card-section.flex.flex-center
                  .text-h6
                  q-icon(:name="'img:'+ `icons/${notebook.node.icon}.svg`" size="xl")
                q-card-section.flex.flex-center.q-pt-none {{notebook.node.title}}
          .row
            q-expansion-item(expand-separator caption="Filter")
              q-btn(outline rounded color="primary" label="all" @click="selectAll(true)")
              q-btn(outline rounded color="primary" label="nothing" @click="selectAll(false)")
              q-checkbox(v-for="categorie in categories" v-model="categorie.check" :label="categorie.title" :key="categorie.id")
</template>

<script>
import axios from "axios";

const endpoint = "http://206.189.176.175/graphql/";

export default {
  name: "NotebooksList",
  data() {
    return {
      notebooks: [],
      current: 1,
      categories: []
    };
  },
  methods: {
    async getNotebooks() {
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `{
            allNotebooks{
              edges{
                node{
                  id
                  title
                  icon
                  sectionsOrder
                  lastUpdate
                  category{
                    id
                    title
                  }
                }
              }
            }
          }`
        }
      })
        .then(result => {
          this.notebooks = result.data.data.allNotebooks.edges;
        })
        .catch(error => {
          alert("Error");
          console.error(error);
        });
    },
    async getCategories() {
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `{
            allCategories{
              edges{
                node{
                  id
                  title
                }
              }
            }
          }`
        }
      })
        .then(result => {
          var categoriasCount = result.data.data.allCategories.edges.length;
          var categoria = {};
          for (var i = 0; i < categoriasCount; i++) {
            var categoria = {};
            categoria["id"] = result.data.data.allCategories.edges[i].node.id;
            categoria["title"] =
              result.data.data.allCategories.edges[i].node.title;
            categoria["check"] = true;
            this.categories.push(categoria);
          }
        })
        .catch(error => {
          alert("Error");
          console.error(error);
        });
    },
    getItemVisibility(id) {
      return this.categories.find(object => object.id == id).check;
    },
    selectAll(bool) {
      var categoriasCount = this.categories.length;
      for (var i = 0; i < categoriasCount; i++) {
        this.categories[i]["check"] = bool;
      }
    }
  },
  mounted() {
    this.getCategories();
    this.getNotebooks();
  }
};
</script>

<style lang="sass" scoped>
.title
  font-size: 2em
</style>
