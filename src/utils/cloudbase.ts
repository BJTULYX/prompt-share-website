import cloudbase from '@cloudbase/js-sdk';

const app = cloudbase.init({
  env: 'image2-website-d6g82nhtx7d14e750'
});

export const auth = app.auth({
  persistence: 'local'
});

export const db = app.database();

export default app;
