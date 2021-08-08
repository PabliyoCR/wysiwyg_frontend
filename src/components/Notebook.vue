<template lang="pug">
    q-page.row.no-wrap
        .col-1
            SidebarSections(:sectionsOrder="sectionsOrder")
        .col
            Note
        .col-2
            SidebarNotes
</template>

<script>
import SidebarNotes from '@/components/notebook/SidebarNotes.vue'
import Note from '@/components/notebook/Note.vue'
import SidebarSections from '@/components/notebook/SidebarSections.vue'

export default {
    name: 'Notebook',
    components: {SidebarNotes, Note, SidebarSections},
    props: ['sectionsOrder'],
}
</script>

<style lang="scss" scoped>

</style>