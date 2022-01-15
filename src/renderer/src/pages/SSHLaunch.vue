<template>
  <h1 class="page-title left">SSH Profiles</h1>
  <div class="page-full-height-scrollable">
    <section class="ssh-list">
      <div class="ssh-list-item" v-for="profile in sshProfiles" :key="profile.id"></div>
    </section>
  </div>
</template>
<script lang="ts" setup>
import StoredValue from '../helpers/localStorage';
import { ref, computed } from 'vue';
import { ISSHProfile } from '../models/ssh_profiles';

const sshProfilesHandle = computed<StoredValue<ISSHProfile[]>>(() => {
  const data = new StoredValue<ISSHProfile[]>('ssh_profiles');
  data.load();

  return data;
});

function addProfile(profile: ISSHProfile) {
  let profiles = sshProfilesHandle.value.getValue();
  profiles.push(profile);
  sshProfilesHandle.value.setValue(profiles);
  sshProfilesHandle.value.save();
}

function updateProfile(id: number, profile: ISSHProfile) {
  let profiles = sshProfilesHandle.value.getValue();
  profile.id = id;
  profiles.map((p: ISSHProfile) => {
    if (p.id != id) return p;
    return profile;
  });
}

function deleteProfile(id: number) {
  let profiles = sshProfilesHandle.value.getValue();
  profiles = profiles.filter((profile: ISSHProfile) => profile.id != id);

  sshProfilesHandle.value.setValue(profiles);
  sshProfilesHandle.value.save();
}

function getProfile(id: number) {
  let profiles = sshProfilesHandle.value.getValue();

  return profiles.filter((profile: ISSHProfile) => profile.id == id)[0];
}

function runProfile(profile: ISSHProfile) {
  // ... to be implemented
}
</script>
