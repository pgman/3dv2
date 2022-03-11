class App {
	static init() {
		App.CANVAS_WIDTH = 800;								// <canvas>の幅
		App.CANVAS_HEIGHT = 600;							// <canvas>の高さ
		App.SUN_RADIUS = 100;								// 太陽の半径
		App.SUN_ROT_Y_SPEED = 1 / 360 * 2 * Math.PI;		// 太陽の自転の速度
		App.SUN_COLOR = { r: 255, g: 0, b: 0 };				// 太陽の色
		App.SUN_LIGHTS = [
			{ x: 1, y: 0, z: 0, },
			{ x: -1, y: 0, z: 0, },
			{ x: 0, y: 1, z: 0, },
			{ x: 0, y: -1, z: 0, },
			{ x: 0, y: 0, z: 1 },
			{ x: 0, y: 0, z: -1 },
		];													// 太陽の光源(太陽を明るく見せるためにいろんな方向から照らす)
		App.SUN_LIGHTS_VALUES = [
			0.7, 0.7, 0.7, 0.7, 0.7, 0.7,
		];
		App.EARTH_RADIUS = 50;								// 地球の半径
		App.EARTH_REVOLUTION_RADIUS = 300;					// 地球の公転の半径
		App.EARTH_ROT_Y_SPEED = 2 / 360 * 2 * Math.PI;		// 地球の自転の速度
		App.EARTH_REV_Y_SPEED = 0.5 / 360 * 2 * Math.PI;	// 地球の公転の速度
		App.EARTH_AXIS_TILT = -23.4 / 360 * 2 * Math.PI;	// 地軸の傾き
		App.EARTH_COLOR = { r: 0, g: 255, b: 255 };			// 地球の色
		App.EARTH_LIGHTS_VALUES = [
			1.0,
		];

		App.MOON_RADIUS = 20;								// 月の半径
		App.MOON_REVOLUTION_RADIUS = 80;					// 月の公転の半径
		App.MOON_ROT_Y_SPEED = 4 / 360 * 2 * Math.PI;		// 月の自転の速度
		App.MOON_REV_Y_SPEED = 2.5 / 360 * 2 * Math.PI;		// 月の公転の速度
		App.MOON_AXIS_TILT = 6.68 / 360 * 2 * Math.PI;		// 月の自転軸の傾き
		App.MOON_REV_Y_AXIS_TILT = 5.14 / 360 * 2 * Math.PI;// 月の公転軸の傾き
		App.MOON_COLOR = { r: 255, g: 255, b: 0 };			// 月の色
		App.MOON_LIGHTS_VALUES = [
			1.0,
		];

		const canvas = document.getElementById('canvas');
		canvas.width = App.CANVAS_WIDTH;
		canvas.height = App.CANVAS_HEIGHT;
		const ctx = canvas.getContext('2d');

		App.sunRotY = 0;		// 太陽自転
		App.earthRotY = 0;		// 地球自転
		App.earthRevY = 0;		// 地球公転		
		App.moonRotY = 0;		// 月自転
		App.moonRevY = 0;		// 月公転		
		App.drawMode = 'wireframe';	// 描画モード
		App.sunRotYCheck = true;	// 太陽が自転するか
		App.earthRotYCheck = true;	// 地球が自転するか
		App.earthRevYCheck = true;	// 地球が公転するか
		App.moonRotYCheck = true;	// 月が自転するか
		App.moonRevYCheck = true;	// 月が公転するか
		App.viewRotX = 0;	// X軸周りの回転角
		App.viewRotY = 0;	// Y軸周りの回転角
		App.sun = null;		// 太陽の三角形群
		App.earth = null;	// 地球の三角形群
		App.moon = null;	// 月の三角形群
		App.divides = 16;	// 太陽と地球の円の分割数
		App.dividesChanged = false;		// 太陽と地球の円の分割数に変更があったか
		App.preX = 0;	// mousedown,mousemove時のX座標
		App.preY = 0;	// mousedown,mousemove時のY座標
		App.down = '';	// 'left' or 'right'
		App.viewVolume = { x: -App.CANVAS_WIDTH / 2, y: -App.CANVAS_HEIGHT / 2, 
			w: App.CANVAS_WIDTH, h: App.CANVAS_HEIGHT }; // 可視範囲
		App.updateTransView();

		App.attachEvents(ctx);

		setInterval(() => {
			// モデル作成
			if(!App.sun || App.dividesChanged) {
				App.sun = Primitive.ball(App.SUN_RADIUS, App.divides);
			}
			if(!App.earth || App.dividesChanged) {
				App.earth = Primitive.ball(App.EARTH_RADIUS, App.divides);
			}	
			if(!App.moon || App.dividesChanged) {
				App.moon = Primitive.ball(App.MOON_RADIUS, App.divides);
			}			
			App.dividesChanged = false;

			if(App.sunRotYCheck) { App.sunRotY += App.SUN_ROT_Y_SPEED; }		
			if(App.earthRotYCheck) { App.earthRotY += App.EARTH_ROT_Y_SPEED; }
			if(App.earthRevYCheck) { App.earthRevY += App.EARTH_REV_Y_SPEED; }		
			if(App.moonRotYCheck) { App.moonRotY += App.MOON_ROT_Y_SPEED; }
			if(App.moonRevYCheck) { App.moonRevY += App.MOON_REV_Y_SPEED; }			

			// ビュー行列
			let viewMatrix = Matrix4x4.identify();
			let rotXView = Matrix4x4.rotateX(App.viewRotX);
			let rotYView = Matrix4x4.rotateY(App.viewRotY);
			// <canvas> の左下隅を原点とし、上方向をY+にする
			let scaleView = Matrix4x4.scalar(1, -1, 1);
			let transView = Matrix4x4.translate(0, App.CANVAS_HEIGHT, 0);
			
			viewMatrix = Matrix4x4.multiply(rotXView, viewMatrix);
			viewMatrix = Matrix4x4.multiply(rotYView, viewMatrix);
			viewMatrix = Matrix4x4.multiply(App.transView, viewMatrix);
			viewMatrix = Matrix4x4.multiply(scaleView, viewMatrix);
			viewMatrix = Matrix4x4.multiply(transView, viewMatrix);

			// 太陽のモデル行列
			let sunMatrix = Matrix4x4.identify();
			let sunRotY = Matrix4x4.rotateY(App.sunRotY);
			sunMatrix = Matrix4x4.multiply(sunRotY, sunMatrix);		
			
			// 地球のモデル行列
			let earthMatrix = Matrix4x4.identify();			
			let earthRotY = Matrix4x4.rotateY(App.earthRotY);
			let earthRotZ = Matrix4x4.rotateZ(App.EARTH_AXIS_TILT);
			// ※地球の公転は平行移動行列を使う。そうしないと回転してしまう。
			let earthRev = Matrix4x4.rotateY(App.earthRevY);
			const earthTransPos = Matrix4x4.multiplyVec(earthRev, { x: App.EARTH_REVOLUTION_RADIUS, y: 0, z: 0 });
			const earthTrans = Matrix4x4.translate(earthTransPos.x, earthTransPos.y, earthTransPos.z);
			
			earthMatrix = Matrix4x4.multiply(earthRotY, earthMatrix);
			earthMatrix = Matrix4x4.multiply(earthRotZ, earthMatrix);
			earthMatrix = Matrix4x4.multiply(earthTrans, earthMatrix);

			// 月のモデル行列
			let moonMatrix = Matrix4x4.identify();			
			let moonRotY = Matrix4x4.rotateY(App.moonRotY);
			let moonRotZ = Matrix4x4.rotateZ(App.MOON_AXIS_TILT);
			// ※月の公転は平行移動行列を使う。そうしないと回転してしまう。
			let moonRev = Matrix4x4.rotateY(App.moonRevY);
			const moonTransPos = Matrix4x4.multiplyVec(moonRev, { x: App.MOON_REVOLUTION_RADIUS, y: 0, z: 0 });
			const moonTrans = Matrix4x4.translate(moonTransPos.x, moonTransPos.y, moonTransPos.z);
			let moonRecRotZ = Matrix4x4.rotateZ(App.MOON_REV_Y_AXIS_TILT);

			moonMatrix = Matrix4x4.multiply(moonRotY, moonMatrix);
			moonMatrix = Matrix4x4.multiply(moonRotZ, moonMatrix);
			moonMatrix = Matrix4x4.multiply(moonTrans, moonMatrix);
			moonMatrix = Matrix4x4.multiply(moonRecRotZ, moonMatrix);
			//moonMatrix = Matrix4x4.multiply(earthRotY, moonMatrix);
			//moonMatrix = Matrix4x4.multiply(earthRotZ, moonMatrix);
			moonMatrix = Matrix4x4.multiply(earthTrans, moonMatrix);
			
			// 太陽と地球をどちらを先に描くか計算する
			// ※原点に行列を掛けてスクリーン座標系で判断する
			const multiSunMatrix = Matrix4x4.multiply(viewMatrix, sunMatrix);
			const multiEarthMatrix = Matrix4x4.multiply(viewMatrix, earthMatrix);
			const multiMoonMatrix = Matrix4x4.multiply(viewMatrix, moonMatrix);
			const sunPos = Matrix4x4.multiplyVec(multiSunMatrix, { x: 0, y: 0, z: 0 });
			const earthPos = Matrix4x4.multiplyVec(multiEarthMatrix, { x: 0, y: 0, z: 0 });
			const moonPos = Matrix4x4.multiplyVec(multiMoonMatrix, { x: 0, y: 0, z: 0 });
			
			// 太陽から地球への光を計算する(ワールド座標系)
			const sunWorldPos = Matrix4x4.multiplyVec(sunMatrix, { x: 0, y: 0, z: 0 });
			const earthWorldPos = Matrix4x4.multiplyVec(earthMatrix, { x: 0, y: 0, z: 0 });
			const moonWorldPos = Matrix4x4.multiplyVec(moonMatrix, { x: 0, y: 0, z: 0 });

			const earthLights = [ Vector3d.subtract(earthWorldPos, sunWorldPos) ];
			const moonLights = [ Vector3d.subtract(moonWorldPos, sunWorldPos) ];

			const objArray = [
				{
					z: sunPos.z,
					model: App.sun,
					matrix: sunMatrix,
					color: App.SUN_COLOR,
					lights: App.SUN_LIGHTS,
					lightsValues: App.SUN_LIGHTS_VALUES,
				},
				{
					z: earthPos.z,
					model: App.earth,
					matrix: earthMatrix,
					color: App.EARTH_COLOR,
					lights: earthLights,
					lightsValues: App.EARTH_LIGHTS_VALUES,
				},
				{
					z: moonPos.z,
					model: App.moon,
					matrix: moonMatrix,
					color: App.MOON_COLOR,
					lights: moonLights,
					lightsValues: App.MOON_LIGHTS_VALUES,
				},
			];
			objArray.sort((a, b) => a.z - b.z);

			if(App.drawMode === 'wireframe' || App.drawMode === 'flat-shading') {
				// 背景をクリア
				ctx.fillStyle = 'black';
				ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
				objArray.forEach(obj => {
					App.draw(ctx, obj.model, obj.matrix, viewMatrix, 
						obj.color, obj.lights, obj.lightsValues, App.drawMode);
				});
			} else if(App.drawMode === 'gouraud-shading') {
				const imgData = App.createImageData();
				objArray.forEach(obj => {
					App.drawGouraudShading(ctx, obj.model, obj.matrix, viewMatrix,
						obj.color, obj.lights, obj.lightsValues, imgData);
				});
				ctx.putImageData(imgData, 0, 0);
			} else if(App.drawMode === 'phong-shading') {
				const imgData = App.createImageData();
				objArray.forEach(obj => {
					App.drawPhongShading(ctx, obj.model, obj.matrix, viewMatrix,
						obj.color, obj.lights, obj.lightsValues, imgData);
				});
				ctx.putImageData(imgData, 0, 0);
			}			
		}, 1000 / 60);
	}	
	// ワイヤーフレームとフラットシェーディングの描画
	static draw(ctx, model, modelMatrix, viewMatrix, color, lights, lightsValues, drawMode) {
		ctx.save();
		ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
		ctx.fillStyle = 'black';
		const matrix = Matrix4x4.multiply(viewMatrix, modelMatrix);
		model.forEach(tri => {
			let p = tri.pos.map(p => Matrix4x4.multiplyVec(matrix, p));
			const v0 = Vector3d.subtract(p[1], p[0]);
			const v1 = Vector3d.subtract(p[2], p[0]);
			// 左手座標系なので、外積は v1 から v0へ計算する
			const outer = Vector3d.outerProduct(v1, v0);
			if(outer.z > 0) {// 視点と逆側を向いているので描画しない
				return;
			}
			ctx.beginPath();		
			if(drawMode === 'flat-shading') {
				// 三角形を若干膨らませる(シェーディング時に三角形の継ぎ目に線ができるのを防ぐため)
				const g = {
					x: (p[0].x + p[1].x + p[2].x) / 3,
					y: (p[0].y + p[1].y + p[2].y) / 3,
					z: (p[0].z + p[1].z + p[2].z) / 3,
				};
				const scale = App.CANVAS_WIDTH / App.viewVolume.w;
				p = p.map(p => {
					let v = Vector3d.subtract(p, g);
					v = Vector3d.unit(v);
					v = Vector3d.scalar(v, scale * 1); // 係数は適当
					return Vector3d.add(p, v);
				});
	    	} 
	    	ctx.moveTo(p[0].x, p[0].y);
	    	ctx.lineTo(p[1].x, p[1].y);
	    	ctx.lineTo(p[2].x, p[2].y);
			ctx.lineTo(p[0].x, p[0].y);
    		ctx.closePath();
    		if(drawMode === 'flat-shading') {
    			// ワールド座標系で、輝度を計算する
    			const wp = tri.pos.map(p => Matrix4x4.multiplyVec(modelMatrix, p));
				const wv0 = Vector3d.subtract(wp[1], wp[0]);
				const wv1 = Vector3d.subtract(wp[2], wp[0]);
				const wouter = Vector3d.outerProduct(wv1, wv0);
    			const n = Vector3d.unit(wouter);
    			// 輝度(色を計算する)
    			let c = lights.reduce((p, c, i) => {
    				const l = Vector3d.unit(c);
    				let inner = -Vector3d.innerProduct(l, n);
    				if(inner < 0) { inner = 0; }
    				return p + inner * lightsValues[i];
    			}, 0);
    			if(c > 1) { c = 1; }
    			else if(c < 0) { c = 0; }
    			ctx.fillStyle = `rgb(${color.r * c}, ${color.g * c}, ${color.b * c})`;
    		}
    		ctx.fill();
    		if(drawMode === 'wireframe') {
    			ctx.stroke();
    		}    		
		});
		ctx.restore();
	}
	static createImageData() {
		const imgData = new ImageData(App.CANVAS_WIDTH, App.CANVAS_HEIGHT);
		const data = imgData.data;
		// 背景を黒で塗りつぶす
		for(let i = 0; i < data.length; i += 4) {
			data[i + 3] = 255;
		}
		return imgData;
	}
	static drawGouraudShading(ctx, model, modelMatrix, viewMatrix, color, lights, lightsValues, imgData) {
		const matrix = Matrix4x4.multiply(viewMatrix, modelMatrix);
		model.forEach(tri => {
			let p = tri.pos.map(p => Matrix4x4.multiplyVec(matrix, p));
			const v0 = Vector3d.subtract(p[1], p[0]);
			const v1 = Vector3d.subtract(p[2], p[0]);
			// 左手座標系なので、外積は v1 から v0へ計算する
			const outer = Vector3d.outerProduct(v1, v0);
			if(outer.z > 0) {// 視点と逆側を向いているので描画しない
				return;
			}
			// 座標を整数にする
			p = p.map(p => {
				p.x = Math.round(p.x);
				p.y = Math.round(p.y);
				return p;
			});
			// 3点の座標の法線ベクトルをワールド座標系で求める
			// モデル行列から回転成分だけを抽出したいが面倒なので、原点と法線にモデル行列を掛ける
			// 原点をワールド座標へ変換する
			const wo = Matrix4x4.multiplyVec(modelMatrix, { x: 0, y: 0, z: 0 });
			const wn = tri.nrm.map(n => {
				let wn = Matrix4x4.multiplyVec(modelMatrix, n);
				wn = Vector3d.subtract(wn, wo);
				wn = Vector3d.unit(wn);
				return wn;
			});			

			// 3点の座標の輝度を求める
			const colors = wn.map(n => {
				// 輝度(色を計算する)
    			let c = lights.reduce((p, c, i) => {
    				const l = Vector3d.unit(c);
    				let inner = -Vector3d.innerProduct(l, n);
    				if(inner < 0) { inner = 0; }
    				return p + inner * lightsValues[i];
    			}, 0);
    			if(c > 1) { c = 1; }
    			else if(c < 0) { c = 0; }
    			return {
    				r: Math.round(color.r * c), 
    				g: Math.round(color.g * c), 
    				b: Math.round(color.b * c),
    			};
			});
			App.gouraudShading(imgData, p, colors);
		});
	}
	// グーローシェーディングのメイン部分
	// ※あまりよくないがとりあえず動くのでこれで良しとする
	static gouraudShading(imgData, pos, colors) {
		const data = imgData.data;
		let buf = [];

		for(let i = 0; i < pos.length; i += 1) {
			const n = (i + 1) % pos.length;
			const cp = pos[i];
			const np = pos[n];

			const diffX = Math.abs(cp.x - np.x);
			const diffY = Math.abs(cp.y - np.y);

			if(diffX === 0 && diffY === 0) {
				buf.push({ x: cp.x, y: cp.y, c: colors[i] });
				continue;
			}

			if(diffX > diffY) {
				// X 軸に沿うようにする
				let a, sx, ex, sy, sc, ec, ac;
				if(cp.x < np.x) { 
					a = (np.y - cp.y) / diffX;
					sx = cp.x;
					ex = np.x; 
					sy = cp.y;
					sc = colors[i];
					ec = colors[n];
				} else { 
					a = (cp.y - np.y) / diffX; 
					sx = np.x;
					ex = cp.x; 
					sy = np.y;
					sc = colors[n];
					ec = colors[i];
				}
				ac = {
					r: (ec.r - sc.r) / diffX,
					g: (ec.g - sc.g) / diffX,
					b: (ec.b - sc.b) / diffX,
				};
				for(let x = sx; x <= ex; x += 1) {
					const dx = x - sx;
					let y = Math.round(sy + dx * a);

					// 色を取得
					let c = {
						r: Math.round(sc.r + dx * ac.r),
						g: Math.round(sc.g + dx * ac.g),
						b: Math.round(sc.b + dx * ac.b),
					};
					buf.push({ x: x, y: y, c });
				}
			} else {
				// Y 軸に沿うようにする
				let a, sy, ey, sx, sc, ec, ac;
				if(cp.y < np.y) { 
					a = (np.x - cp.x) / diffY;
					sy = cp.y;
					ey = np.y; 
					sx = cp.x;
					sc = colors[i];
					ec = colors[n];
				} else { 
					a = (cp.x - np.x) / diffY; 
					sy = np.y;
					ey = cp.y; 
					sx = np.x;
					sc = colors[n];
					ec = colors[i];
				}
				ac = {
					r: (ec.r - sc.r) / diffY,
					g: (ec.g - sc.g) / diffY,
					b: (ec.b - sc.b) / diffY,
				};
				for(let y = sy; y <= ey; y += 1) {
					const dy = (y - sy);
					let x = Math.round(sx + dy * a);
					// 色を取得
					let c = {
						r: Math.round(sc.r + dy * ac.r),
						g: Math.round(sc.g + dy * ac.g),
						b: Math.round(sc.b + dy * ac.b),
					};
					buf.push({ x: x, y: y, c });
				}
			}			

		}
		if(buf.length === 0) { return; }
		buf.sort((a, b) => {
			if(a.y === b.y) {
				return a.x - b.x;
			} else {
				return a.y - b.y;
			}
		});

		// minY, maxY
		const minY = buf[0].y;
		const maxY = buf[buf.length - 1].y;
		let ci = 0;
		for(let y = minY; y <= maxY; y += 1) {
			let sx = Number.MAX_VALUE,
				ex = -Number.MAX_VALUE,
				xCnt = 0, sc, ec, ac;
			for(;ci < buf.length; ci += 1) {
				const cy = buf[ci].y;
				if(cy > y) { break; }
				const cx = buf[ci].x;
				if(cx < sx) { 
					sx = cx; 
					sc = buf[ci].c;
				}
				if(cx > ex) { 
					ex = cx; 
					ec = buf[ci].c;
				}
				xCnt += 1;
			}
			// 1点の場合は何もしない
			if(xCnt <= 1) { continue; }
			
			// ラスタライズ
			const diffX = ex - sx;
			ac = {
				r: (ec.r - sc.r) / diffX,
				g: (ec.g - sc.g) / diffX,
				b: (ec.b - sc.b) / diffX,
			};
			let beginX = sx;
			if(beginX < 0) { beginX = 0; }
			let endX = ex;
			if(endX > imgData.width) { endX = imgData.width - 1; }
			for(let x = beginX; x <= endX; x += 1) {
				const dx = x - sx;
				let c = {
					r: Math.round(sc.r + dx * ac.r),
					g: Math.round(sc.g + dx * ac.g),
					b: Math.round(sc.b + dx * ac.b),
				};
				if(x >= 0 && x < imgData.width && y >= 0 && y < imgData.height) {
					setColor(imgData, x, y, c);
				}
			}
		}
		function setColor(imgData, x, y, c) {
			const i = 4 * (y * imgData.width + x);
			imgData.data[i] = c.r;
			imgData.data[i + 1] = c.g;
			imgData.data[i + 2] = c.b;
			imgData.data[i + 3] = 255;
		}
	}
	static drawPhongShading(ctx, model, modelMatrix, viewMatrix, color, lights, lightsValues, imgData) {
		const matrix = Matrix4x4.multiply(viewMatrix, modelMatrix);
		model.forEach(tri => {
			let p = tri.pos.map(p => Matrix4x4.multiplyVec(matrix, p));
			const v0 = Vector3d.subtract(p[1], p[0]);
			const v1 = Vector3d.subtract(p[2], p[0]);
			// 左手座標系なので、外積は v1 から v0へ計算する
			const outer = Vector3d.outerProduct(v1, v0);
			if(outer.z > 0) {// 視点と逆側を向いているので描画しない
				return;
			}
			// 座標を整数にする
			p = p.map(p => {
				p.x = Math.round(p.x);
				p.y = Math.round(p.y);
				return p;
			});
			// 3点の座標の法線ベクトルをワールド座標系で求める
			// モデル行列から回転成分だけを抽出したいが面倒なので、原点と法線にモデル行列を掛ける
			// 原点をワールド座標へ変換する
			const wo = Matrix4x4.multiplyVec(modelMatrix, { x: 0, y: 0, z: 0 });
			const nrms = tri.nrm.map(n => {
				let wn = Matrix4x4.multiplyVec(modelMatrix, n);
				wn = Vector3d.subtract(wn, wo);
				wn = Vector3d.unit(wn);
				return wn;
			});	
			App.phongShading(imgData, p, nrms, color, lights, lightsValues);
		});
	}
	// フォンシェーディングのメイン部分
	static phongShading(imgData, pos, nrms, color, lights, lightsValues) {
		const data = imgData.data;
		let buf = [];

		for(let i = 0; i < pos.length; i += 1) {
			const n = (i + 1) % pos.length;
			const cp = pos[i];
			const np = pos[n];

			const diffX = Math.abs(cp.x - np.x);
			const diffY = Math.abs(cp.y - np.y);

			if(diffX === 0 && diffY === 0) {
				buf.push({ x: cp.x, y: cp.y, n: nrms[i] });
				continue;
			}

			if(diffX > diffY) {
				// X 軸に沿うようにする
				let a, sx, ex, sy, sn, en, an;
				if(cp.x < np.x) { 
					a = (np.y - cp.y) / diffX;
					sx = cp.x;
					ex = np.x; 
					sy = cp.y;
					sn = nrms[i];
					en = nrms[n];
				} else { 
					a = (cp.y - np.y) / diffX; 
					sx = np.x;
					ex = cp.x; 
					sy = np.y;
					sn = nrms[n];
					en = nrms[i];
				}
				an = {
					x: (en.x - sn.x) / diffX,
					y: (en.y - sn.y) / diffX,
					z: (en.z - sn.z) / diffX,
				};
				for(let x = sx; x <= ex; x += 1) {
					const dx = x - sx;
					let y = Math.round(sy + dx * a);

					// 法線を取得
					let nrm = {
						x: sn.x + dx * an.x,
						y: sn.y + dx * an.y,
						z: sn.z + dx * an.z,
					};
					buf.push({ x: x, y: y, n: nrm });
				}
			} else {
				// Y 軸に沿うようにする
				let a, sy, ey, sx, sn, en, an;
				if(cp.y < np.y) { 
					a = (np.x - cp.x) / diffY;
					sy = cp.y;
					ey = np.y; 
					sx = cp.x;
					sn = nrms[i];
					en = nrms[n];
				} else { 
					a = (cp.x - np.x) / diffY; 
					sy = np.y;
					ey = cp.y; 
					sx = np.x;
					sn = nrms[n];
					en = nrms[i];
				}
				an = {
					x: (en.x - sn.x) / diffY,
					y: (en.y - sn.y) / diffY,
					z: (en.z - sn.z) / diffY,
				};
				for(let y = sy; y <= ey; y += 1) {
					const dy = (y - sy);
					let x = Math.round(sx + dy * a);
					// 色を取得
					let nrm = {
						x: sn.x + dy * an.x,
						y: sn.y + dy * an.y,
						z: sn.z + dy * an.z,
					};
					buf.push({ x: x, y: y, n: nrm });
				}
			}			

		}
		if(buf.length === 0) { return; }
		buf.sort((a, b) => {
			if(a.y === b.y) {
				return a.x - b.x;
			} else {
				return a.y - b.y;
			}
		});

		// minY, maxY
		const minY = buf[0].y;
		const maxY = buf[buf.length - 1].y;
		let ci = 0;
		for(let y = minY; y <= maxY; y += 1) {
			let sx = Number.MAX_VALUE,
				ex = -Number.MAX_VALUE,
				xCnt = 0, sn, en, an;
			for(;ci < buf.length; ci += 1) {
				const cy = buf[ci].y;
				if(cy > y) { break; }
				const cx = buf[ci].x;
				if(cx < sx) { 
					sx = cx; 
					sn = buf[ci].n;
				}
				if(cx > ex) { 
					ex = cx; 
					en = buf[ci].n;
				}
				xCnt += 1;
			}
			// 1点の場合は何もしない
			if(xCnt <= 1) { continue; }
			
			// ラスタライズ
			const diffX = ex - sx;
			an = {
				x: (en.x - sn.x) / diffX,
				y: (en.y - sn.y) / diffX,
				z: (en.z - sn.z) / diffX,
			};
			let beginX = sx;
			if(beginX < 0) { beginX = 0; }
			let endX = ex;
			if(endX > imgData.width) { endX = imgData.width - 1; }
			for(let x = beginX; x <= endX; x += 1) {
				const dx = x - sx;
				let nrm = {
					x: sn.x + dx * an.x,
					y: sn.y + dx * an.y,
					z: sn.z + dx * an.z,
				};
				if(x >= 0 && x < imgData.width && y >= 0 && y < imgData.height) {
					setColor(imgData, x, y, nrm, color, lights, lightsValues);
				}
			}
		}
		function setColor(imgData, x, y, n, color, lights, lightsValues) {
			// 輝度(色を計算する)
			let c = lights.reduce((p, c, i) => {
				const l = Vector3d.unit(c);
				let inner = -Vector3d.innerProduct(l, n);
				if(inner < 0) { inner = 0; }
				return p + inner * lightsValues[i];
			}, 0);
			if(c > 1) { c = 1; }
			else if(c < 0) { c = 0; }
			const nc = {
				r: Math.round(color.r * c), 
				g: Math.round(color.g * c), 
				b: Math.round(color.b * c),
			};
			const i = 4 * (y * imgData.width + x);
			imgData.data[i] = nc.r;
			imgData.data[i + 1] = nc.g;
			imgData.data[i + 2] = nc.b;
			imgData.data[i + 3] = 255;
		}
	}
	// イベントハンドラ
	static attachEvents(ctx, prm) {
		const drawModeSelect = document.getElementById('draw-mode-select');
		drawModeSelect.addEventListener('change', () => {
			const index = drawModeSelect.selectedIndex;
			App.drawMode = drawModeSelect.options[index].value;
		});
		const sunRotationCheck = document.getElementById('sun-rotation-checkbox');
		sunRotationCheck.addEventListener('change', () => {
			App.sunRotYCheck = sunRotationCheck.checked;
		});
		const earthRotationCheck = document.getElementById('earth-rotation-checkbox');
		earthRotationCheck.addEventListener('change', () => {
			App.earthRotYCheck = earthRotationCheck.checked;
		});
		const earthRevolutionCheck = document.getElementById('earth-revolution-checkbox');
		earthRevolutionCheck.addEventListener('change', () => {
			App.earthRevYCheck = earthRevolutionCheck.checked;
		});
		const moonRotationCheck = document.getElementById('moon-rotation-checkbox');
		moonRotationCheck.addEventListener('change', () => {
			App.moonRotYCheck = moonRotationCheck.checked;
		});
		const moonRevolutionCheck = document.getElementById('moon-revolution-checkbox');
		moonRevolutionCheck.addEventListener('change', () => {
			App.moonRevYCheck = moonRevolutionCheck.checked;
		});
		const dividesSelect = document.getElementById('divides-select');
		dividesSelect.addEventListener('change', () => {
			const index = dividesSelect.selectedIndex;
			App.divides = dividesSelect.options[index].value;
			App.dividesChanged = true;
		});
		const canvas = document.getElementById('canvas');
		canvas.addEventListener('mousedown', App.mousedown);
		canvas.addEventListener('mousemove', App.mousemove);
		canvas.addEventListener('mouseup', App.mouseup);
		canvas.addEventListener('mouseout', App.mouseout);
		canvas.addEventListener('wheel', App.wheel);
		canvas.addEventListener('contextmenu', e => { e.preventDefault(); });
	} 
	static mousedown(e) {
		if(e.button === 0) {
			if(App.down !== '') { return; }
			App.preX = e.clientX;
			App.preY = e.clientY;
			App.down = 'left';
		} else if(e.button === 2) {
			if(App.down !== '') { return; }
			App.preX = e.clientX;
			App.preY = e.clientY;
			App.down = 'right';
		}
	}
	static mousemove(e) {
		let deltaX, deltaY;
		if(App.down) {
			deltaX = e.clientX - App.preX;
			deltaY = e.clientY - App.preY;			
		}
		if(App.down === 'left') {
			const canvas = document.getElementById('canvas');
			App.viewRotX += deltaY / App.CANVAS_HEIGHT * 2 * Math.PI;
			App.viewRotY += deltaX / App.CANVAS_WIDTH * 2 * Math.PI;
			App.preX = e.clientX;
			App.preY = e.clientY;
		} else if(App.down === 'right') {
			const scale = App.CANVAS_WIDTH / App.viewVolume.w;
			App.viewVolume.x -= deltaX / scale;
			App.viewVolume.y += deltaY / scale;
			App.updateTransView();			
		}
		if(App.down) {
			App.preX = e.clientX;
			App.preY = e.clientY;		
		}
	}
	static mouseup(e) {
		App.down = '';
	}
	static mouseout(e) {
		App.down = '';
	}
	static wheel(e) {
		e.preventDefault();
  		const scale = 1 + e.deltaY * (-0.001);
  		const vv = App.viewVolume;
  		const center = {
  			x: vv.x + vv.w / 2,
  			y: vv.y + vv.h / 2,
  		};
  		vv.w /= scale;
  		vv.h /= scale;
  		vv.x = center.x - vv.w / 2;
  		vv.y = center.y - vv.h / 2;
  		App.updateTransView();   		
	}
	static updateTransView() {
		const vv = App.viewVolume;
		const trans = Matrix4x4.translate(-vv.x, -vv.y, 0);
  		const scaleMat = Matrix4x4.scalar(App.CANVAS_WIDTH / vv.w, App.CANVAS_HEIGHT / vv.h, 1);
  		App.transView = Matrix4x4.multiply(scaleMat, trans);
	}
	
}