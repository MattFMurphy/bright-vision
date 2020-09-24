import React from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

class Labeller extends React.Component {
	constructor() {
		super();
		this.state = {
			uploaded: "\\\\Choose file",
			file: "",
			b64File: "",
			apikey: "",
		};
		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}
	handleChange(event) {
		//Have to handle file fields differently from text
		if (event.target.type == "password") {
			let key = event.target.value;
			this.setState((prevState) => {
				prevState.apikey = key;
				return prevState;
			});
		} else {
			//Convert file field value to base64 string, update state when complete
			const toBase64 = (file, upload_event, _this) =>
				new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.readAsDataURL(file);
					reader.onload = () => {
						let str = reader.result.split("base64,").pop();
						_this.setState((prevState) => {
							prevState.uploaded = upload_event.value;
							prevState.file = upload_event.files[0];
							prevState.b64File = str;
							return prevState;
						});
						resolve(reader.result);
					};
					reader.onerror = (error) => reject(error);
				});

			async function setForUpload(upload_event, _this) {
				const file = upload_event.files[0];
				await toBase64(file, upload_event, _this);
			}

			setForUpload(event.target, this);
		}
	}
	handleSubmit(event) {
		event.preventDefault();
		//Send request
		async function postData(url, state) {
			let dataObj = {
				requests: [
					{
						image: {
							content: state.b64File,
						},
						features: [
							{
								type: "LABEL_DETECTION",
								maxResults: 5,
							},
						],
					},
				],
			};
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(dataObj),
			});
			return response.json();
		}
		//Add api key to endpoint
		let post_url = "https://vision.googleapis.com/v1/images:annotate?key=" + this.state.apikey;

		postData(post_url, this.state).then((data) => {
			//Build an alert out of the labels returned
			let str = "Image Labels:  ";
			data.responses[0].labelAnnotations.forEach(function (label) {
				str = str.concat(label.description, "\n");
			});
			alert(str);
		});
	}

	render() {
		return (
			//React Bootstrap form
			<section className="button-main">
				<div className="container">
					<div className="row">				
						<Form onSubmit={this.handleSubmit}>
							<Form.Row>
								<Form.Group className="mb-2 mr-sm-2">
									<div className="custom-file">
										<Form.Control
											name="file-input"
											type="file"
											onChange={this.handleChange}
											placeholder="Choose file"
											className="custom-file-input"
											id="validatedCustomFile"
											accept="image/*"
											required
											custom
										/>
										<Form.Label style={{ overflow: "hidden" }} className="custom-file-label">
											{this.state.uploaded.split("\\")[2]}
										</Form.Label>
									</div>
								</Form.Group>
								<Form.Group className="mb-2 mr-sm-2">
									<Form.Control
										value={this.state.apikey}
										name="api-key"
										type="password"
										onChange={this.handleChange}
										placeholder="Api key"
										className="form-control"
										required
										custom
									/>
								</Form.Group>
								<Button className="mb-2 " variant="primary" type="submit">
									Submit
								</Button>
							</Form.Row>
						</Form>
					</div>
				</div>
			</section>
		);
	}
}
export default Labeller;
