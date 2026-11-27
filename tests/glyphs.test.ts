import test from 'node:test';
import assert from 'node:assert/strict';
import {waveMesh,perlin3D} from '../src/core/glyphs';
test('sound atoms select distinct finite three-dimensional meshes',()=>{
 assert.equal(waveMesh('s'),null);assert.equal(waveMesh('t')?.vertices.length,5);assert.equal(waveMesh('q')?.vertices.length,8);assert.equal(waveMesh('a')?.vertices.length,6);
 const a=waveMesh('n',3181,1)!;assert.deepEqual(a,waveMesh('n',3181,1));assert.notDeepEqual(a.vertices,waveMesh('n',3182,1)?.vertices);
 assert.notDeepEqual(a.vertices,waveMesh('n',3181,2)?.vertices);assert.ok(a.vertices.flat().every(Number.isFinite));
 for(const face of a.faces)assert.ok(face.every(id=>id>=0&&id<a.vertices.length));
});
test('3D gradient noise is continuous across lattice boundaries and seeded',()=>{
 const a=perlin3D(.999999,.31,2.73,42),b=perlin3D(1.000001,.31,2.73,42);
 assert.ok(Math.abs(a-b)<.0001);assert.equal(perlin3D(1,2,3,42),0);
 assert.notEqual(perlin3D(.3,.4,.5,1),perlin3D(.3,.4,.5,2));
});
