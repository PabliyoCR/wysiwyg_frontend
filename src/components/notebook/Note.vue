<template lang="pug">
    q-scroll-area.q-mx-xl.q-my-sm(style="height: 90vh;" spellcheck="false")
        transition(name="fade")
            PrismEdit(v-show="codeEditor && show" :code = "editor" @updateEditor="updateEditor")
        q-editor(v-show="show" v-model="editor" ref="editor_note_ref" @paste.native="evt => pasteCapture(evt)" :definitions="definitions" :toolbar="toolbar" max-height="85vh")
        p(v-show="!show" v-html="editor" @dblclick="showEditor(true)")
        
        button(v-show="false" v-shortkey="['ctrl', 's']" @shortkey="saveEditorWithoutExit")
        button(v-show="false" v-shortkey="['alt', 's']" @shortkey="saveEditorWithoutExit")

        button(v-show="false" v-shortkey="['tab']" @shortkey="indent(true)")
        button(v-show="false" v-shortkey="['tab', 'shift']" @shortkey="indent(false)")

        button(v-show="false" v-shortkey="['ctrl', 'g']" @shortkey="translate()")
        button(v-show="false" v-shortkey="['ctrl', 'h']" @shortkey="preCodeHTML()")
        button(v-show="false" v-shortkey="['ctrl', 'j']" @shortkey="preCodeJS()")

        button(v-show="false" v-shortkey="['shift', 'enter']" @shortkey="saltoDeLinea()")

        q-dialog(v-model="promptGifSRC")
            q-card(style="min-width: 350px")
                q-card-section
                    .text-h6 Gif url
                q-card-section(class="q-pt-none")
                    q-input(v-model="urlGif" dense autofocus @keyup.enter="insetStaticGifURL(); promptGifSRC = false")
                q-card-actions(align="right" class="text-primary")
                    q-btn(flat label="Cancel" v-close-popup @click="urlGif = ''")
                    q-btn(flat label="Insert Gif" v-close-popup @click="insetStaticGifURL" :disabled="urlGif.length == 0")
</template>

<script>
import PrismEdit from "@/components/notebook/PrismEdit.vue";

import Prism from "prismjs";
import "prismjs/themes/prism-coy.css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-plsql";
import "prismjs/components/prism-c";
import "prismjs/components/prism-python";
import "prismjs/components/prism-r";
import "prismjs/components/prism-css";

import axios from "axios";

const endpoint = "http://206.189.176.175/graphql/";

export default {
  name: "Note",
  components: {
    PrismEdit
  },
  data() {
    return {
      definitions: {
        saveEditorWithoutExit: {
          tip: "Save without Exit",
          icon: "far fa-save",
          handler: this.saveEditorWithoutExit
        },
        saveEditorWithExit: {
          tip: "Save",
          icon: "fas fa-save",
          handler: this.saveEditorWithExit
        },
        insetStaticGif: {
          tip: "Insert Gif",
          icon: "far fa-file-image",
          handler: this.insetStaticGif
        },
        preCodeHTML: {
          tip: "Pre Code HTML",
          icon: "fab fa-html5",
          handler: this.preCodeHTML
        },
        preCodeJS: {
          tip: "Pre Code JS",
          icon: "fab fa-js-square",
          handler: this.preCodeJS
        },
        preCodeTS: {
          tip: "Pre Code TS",
          label: "TS",
          handler: this.preCodeTS
        },
        preCodeCSS: {
          tip: "Pre Code CSS",
          icon: "fab fa-css3",
          handler: this.preCodeCSS
        },
        preCodeCSharp: {
          tip: "Edit Code C#",
          label: "C#",
          handler: this.preCodeCSharp
        },
        preCodeSQL: {
          tip: "Edit Code SQL",
          label: "SQL",
          handler: this.preCodeSQL
        },
        preCodeC: {
          tip: "Edit Code C",
          label: "C",
          handler: this.preCodeC
        },
        preCodePython: {
          tip: "Edit Code Python",
          icon: "fab fa-python",
          handler: this.preCodePython
        },
        preCodeR: {
          tip: "Edit Code R",
          label: "R",
          handler: this.preCodeR
        },
        viewCode: {
          tip: "Edit Code",
          icon: "fas fa-code",
          handler: this.viewCode
        }
      },
      toolbar: [
        ["saveEditorWithoutExit", "saveEditorWithExit"],
        ["bold", "underline"],
        ["undo", "redo"],
        ["quote", "unordered", "ordered", "outdent", "indent"],
        ["insetStaticGif", "hr", "link"],
        [
          "preCodeHTML",
          "preCodeJS",
          "preCodeTS",
          "preCodeCSS",
          "preCodeC",
          "preCodeCSharp",
          "preCodePython",
          "preCodeR",
          "preCodeSQL",
          "viewCode"
        ]
      ],
      editor: "",
      show: false,
      noteID: null,
      urlGif: "",
      promptGifSRC: false,
      codeEditor: false
    };
  },
  methods: {
    async getNote(noteID) {
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `{
                        note(id:"${noteID}"){
                            id
                            content
                        }
                    }`
        }
      })
        .then(result => {
          this.editor = result.data.data.note.content.editor;
          this.noteID = result.data.data.note.id;
          this.show = result.data.data.note.content.showEditor;
          this.higthlightCode();
        })
        .then(Prism.highlightAll())
        .catch(error => {
          alert("Error");
          console.error(error);
        });
    },
    removeEditorContent() {
      this.editor = "";
      this.show = false;
    },
    saveEditorWithoutExit() {
      this.saveEditor();
    },
    saveEditorWithExit() {
      this.saveEditor();
      this.showEditor(false);
      this.codeEditor = false;
    },
    async saveEditor() {
      // reemplazar double quotes to single quotes
      this.editor = this.editor.replace(/"/g, "'");
      this.editor = this.editor.replace(/\\/g, "");
      // Actualizar nota
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `mutation{
                        updateNoteEditor(input:{noteID:"${this.noteID}", editor:"${this.editor}"}){
                            note{
                                id
                            }
                        }
                    }`
        }
      })
        .then(() => {
          this.showNotification();
          this.higthlightCode();
        })
        .catch(error => {
          alert("Error");
          console.error(error);
        });
    },
    async showEditor(bool) {
      // Actualizar nota
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `mutation{
                        updateNoteShowEditor(input:{noteID:"${this.noteID}", show:${bool}}){
                            note{
                                id
                            }
                        }
                    }`
        }
      })
        .then((this.show = bool))
        .catch(error => {
          alert("Error");
          console.error(error);
        });
    },
    showNotification() {
      this.$q.notify({
        type: "positive",
        message: "Saved",
        position: "bottom-left",
        timeout: 1
      });
    },
    pasteCapture(evt) {
      // Let inputs do their thing, so we don't break pasting of links.
      if (evt.target.nodeName === "INPUT") return;
      if (evt.clipboardData.files.length) return;
      let text, onPasteStripFormattingIEPaste;
      evt.preventDefault();
      if (evt.originalEvent && evt.originalEvent.clipboardData.getData) {
        text = evt.originalEvent.clipboardData.getData("text/plain");
        this.$refs.editor_note_ref.runCmd("insertText", text);
        this.updateEditor(
          this.editor.replace(/^\s+|\r\n|\n|\r|(>)+(<)|\s+$/gm, "$1$2")
        );
      } else if (evt.clipboardData && evt.clipboardData.getData) {
        text = evt.clipboardData.getData("text/plain");
        this.$refs.editor_note_ref.runCmd("insertText", text);
        this.updateEditor(
          this.editor.replace(/^\s+|\r\n|\n|\r|(>)+(<)|\s+$/gm, "$1$2")
        );
      } else if (window.clipboardData && window.clipboardData.getData) {
        if (!onPasteStripFormattingIEPaste) {
          onPasteStripFormattingIEPaste = true;
          this.$refs.editor_note_ref.runCmd("ms-pasteTextOnly", text);
        }
        onPasteStripFormattingIEPaste = false;
      }
    },
    indent(in_out) {
      if (in_out) {
        this.$refs.editor_note_ref.runCmd("indent");
      } else {
        this.$refs.editor_note_ref.runCmd("outdent");
      }
    },
    translate() {
      var text = this.getSelectedText();
      axios
        .post(
          "https://translation.googleapis.com/language/translate/v2",
          {},
          {
            params: {
              q: text,
              target: "en",
              key: "AIzaSyDKL7SCe0iJAGakdaoauNaMfKOjBJ8PE7w"
            }
          }
        )
        .then(response => {
          var sel, range;
          if (window.getSelection) {
            sel = window.getSelection();
            if (sel.rangeCount) {
              range = sel.getRangeAt(0);
              range.deleteContents();
              range.insertNode(
                document.createTextNode(
                  response.data.data.translations[0].translatedText
                )
              );
              this.$refs.editor_note_ref.runCmd("underline");
              this.$refs.editor_note_ref.runCmd("underline");
            }
          } else if (document.selection && document.selection.createRange) {
            range = document.selection.createRange();
            range.text = response.data.data.translations[0].translatedText;
          }
        });
    },
    getSelectedText() {
      if (window.getSelection) {
        return window.getSelection().toString();
      } else if (document.selection && document.selection.type != "Control") {
        return document.selection.createRange().text;
      }
    },
    insetStaticGif() {
      this.promptGifSRC = true;
    },
    insetStaticGifURL() {
      this.$refs.editor_note_ref.runCmd(
        "insertHTML",
        `<img src='${this.urlGif}'/>`
      );
    },
    updateEditor(newData) {
      this.editor = newData;
    },
    viewCode() {
      this.codeEditor = !this.codeEditor;
    },
    preCodeHTML() {
      var text = this.getSelectedText();
      this.$refs.editor_note_ref.runCmd(
        "insertHTML",
        `<pre class="language-markup"><code>${text.replace(
          /</g,
          "&lt;"
        )}</code></pre>`
      );
      this.higthlightCode();
    },
    preCodeJS() {
      var text = this.getSelectedText();
      this.$refs.editor_note_ref.runCmd(
        "insertHTML",
        `<pre><code class="language-javascript">${text.replace(
          /</g,
          "&lt;"
        )}</code></pre>`
      );
      this.higthlightCode();
    },
    preCodeTS() {
      var text = this.getSelectedText();
      this.$refs.editor_note_ref.runCmd(
        "insertHTML",
        `<pre><code class="language-typescript">${text.replace(
          /</g,
          "&lt;"
        )}</code></pre>`
      );
      this.higthlightCode();
    },
    preCodeCSS() {
      var text = this.getSelectedText();
      this.$refs.editor_note_ref.runCmd(
        "insertHTML",
        `<pre><code class="language-css">${text.replace(
          /</g,
          "&lt;"
        )}</code></pre>`
      );
      this.higthlightCode();
    },
    preCodeCSharp() {
      var text = this.getSelectedText();
      this.$refs.editor_note_ref.runCmd(
        "insertHTML",
        `<pre><code class="language-csharp">${text.replace(
          /</g,
          "&lt;"
        )}</code></pre>`
      );
      this.higthlightCode();
    },
    preCodeSQL() {
      var text = this.getSelectedText();
      this.$refs.editor_note_ref.runCmd(
        "insertHTML",
        `<pre><code class="language-plsql">${text.replace(
          /</g,
          "&lt;"
        )}</code></pre>`
      );
      this.higthlightCode();
    },
    preCodeC() {
      var text = this.getSelectedText();
      this.$refs.editor_note_ref.runCmd(
        "insertHTML",
        `<pre><code class="language-c">${text.replace(
          /</g,
          "&lt;"
        )}</code></pre>`
      );
      this.higthlightCode();
    },
    preCodePython() {
      var text = this.getSelectedText();
      this.$refs.editor_note_ref.runCmd(
        "insertHTML",
        `<pre><code class="language-python">${text.replace(
          /^\s+|\r\n|\n|\r|(>)\s+(<)|\s+$/gm,
          "$1$2"
        )}</code></pre>`
      );
      this.higthlightCode();
    },
    preCodeR() {
      var text = this.getSelectedText();
      this.$refs.editor_note_ref.runCmd(
        "insertHTML",
        `<pre><code class="language-r">${text.replace(
          /^\s+|\r\n|\n|\r|(>)\s+(<)|\s+$/gm,
          "$1$2"
        )}</code></pre>`
      );
      this.higthlightCode();
    },
    higthlightCode() {
      setTimeout(() => {
        Prism.highlightAll();
      }, 100);
    },
    saltoDeLinea() {
      this.$refs.editor_note_ref.runCmd("insertHTML", "<br>");
    }
  },
  mounted() {
    this.$root.$refs.Note = this;
  }
};
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
