<template lang="pug">
  prism-editor.my-editor.height-300(v-model="editor" :highlight="highlighter" line-numbers = true @input="updateEditor")
</template>

<script>
import { PrismEditor } from "vue-prism-editor"
import "vue-prism-editor/dist/prismeditor.min.css"

import { highlight, languages } from "prismjs/components/prism-core"
import "prismjs/components/prism-clike"
import "prismjs/components/prism-markup"
import "prismjs/themes/prism-tomorrow.css"

export default {
  components: {
    PrismEditor
  },
  props: ['code'],
  data () {
    return {
      editor: ''
    }
  },
  methods: {
    highlighter(code) {
      return highlight(code, languages.markup)
    },
    process(str) {
      var div = document.createElement('div')
      div.innerHTML = str.trim()
      return this.format(div, 0).innerHTML
    },
    format(node, level) {
      var indentBefore = new Array(level++ + 1).join('  '),
        indentAfter  = new Array(level - 1).join('  '),
        textNode;
        
      for (var i = 0; i < node.children.length; i++) {
        textNode = document.createTextNode('\n' + indentBefore)
        node.insertBefore(textNode, node.children[i])
        this.format(node.children[i], level)
        if (node.lastElementChild == node.children[i]) {
          textNode = document.createTextNode('\n' + indentAfter)
          node.appendChild(textNode)
        }
      }
      return node;
    },
    updateEditor(){
      this.$emit('updateEditor', this.editor.replace(/^\s+|\r\n|\n|\r|(>)\s+(<)|\s+$/gm, '$1$2'))
    }
  },
  watch: {
    code(){
      this.editor = this.process(this.code)
    }
  }
};
</script>

<style lang="scss">
// required class
.my-editor {
  background: #2d2d2d;
  color: #ccc;

  font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 5px;
}

// optional
.prism-editor__textarea:focus {
  outline: none;
}

// not required:
.height-300 {
  height: 300px;
}
</style>
