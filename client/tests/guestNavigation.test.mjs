import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  loginDestination, loginPath, roadmapPath, validatedReturnPath,
} from '../src/utils/guestNavigation.js';

const student = { role: 'student', activeDomain: 'dsa' };

test('guest sign-in and refresh retain the full deep link', () => {
  const location = { pathname: '/topic/lesson', search: '?cp=arr_cp2', hash: '#practice' };
  const login = new URL(loginPath(location), 'https://careerforge.test');
  const refreshedLogin = new URL(login.href);
  const next = refreshedLogin.searchParams.get('next');
  assert.equal(validatedReturnPath(next), '/topic/lesson?cp=arr_cp2#practice');
  assert.equal(loginDestination(next, student), '/topic/lesson?cp=arr_cp2#practice');
  assert.equal(loginDestination(next, { role: 'student' }), next);
});

test('guest browse routes and domain share links are valid return paths', () => {
  for (const path of [
    '/dashboard', '/domains', '/roadmap', roadmapPath('domain-1'), '/ide',
    '/academics', '/academics/subjects/sem/branch', '/academics/subject/sub',
    '/academics/chapter/chapter',
  ]) assert.equal(validatedReturnPath(path), path);
  assert.equal(roadmapPath('domain-1'), '/roadmap?domain=domain-1');
});

test('role checks apply to post-Google-login destinations', () => {
  const admin = { role: 'admin' };
  assert.equal(validatedReturnPath('/profile'), null);
  assert.equal(loginDestination('/profile', student), '/profile');
  assert.equal(loginDestination('/admin/problems/edit/p1', student), '/dashboard');
  assert.equal(loginDestination('/admin/problems/edit/p1', admin), '/admin/problems/edit/p1');
  assert.equal(loginDestination(null, admin), '/admin');
  assert.equal(loginDestination(null, { role: 'student' }), '/domains');
});

test('external, encoded-path, unknown and login-loop destinations are rejected', () => {
  for (const path of [
    'https://elsewhere.test', '//elsewhere.test', '/\\elsewhere.test', '/%2felsewhere.test',
    '/topic/%2e%2e', '/topic/../admin', '/login?next=/dashboard', '/signup', '/unknown', '/dashboard\n',
  ]) {
    assert.equal(validatedReturnPath(path, 'admin'), null);
    assert.equal(loginDestination(path, student), '/dashboard');
  }
});
