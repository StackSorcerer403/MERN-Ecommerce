import React, { useEffect } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { Table, Button, Row, Col } from 'react-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';
import {
	listProducts,
	deleteProduct,
	createProduct,
} from '../actions/productActions';
import { PRODUCT_CREATE_RESET } from '../constants/productConstants';
import Paginate from '../components/Paginate';

const ProductListPage = ({ history, match }) => {
	const pageNumber = match.params.pageNumber || 1;
	const dispatch = useDispatch();
	const productList = useSelector((state) => state.productList);
	const { loading, products, error, pages, page } = productList;

	const productDelete = useSelector((state) => state.productDelete);
	const {
		loading: loadingDelete,
		success: successDelete,
		error: errorDelete,
	} = productDelete;

	const productCreate = useSelector((state) => state.productCreate);
	const {
		loading: loadingCreate,
		success: successCreate,
		error: errorCreate,
		product: createdProduct,
	} = productCreate;
	const userLogin = useSelector((state) => state.userLogin);
	const { userInfo } = userLogin;

	useEffect(() => {
		if (!userInfo.isAdmin) history.push('/login');
		dispatch({ type: PRODUCT_CREATE_RESET });
		if (successCreate)
			history.push(`/admin/product/${createdProduct._id}/edit`);
		else dispatch(listProducts('', pageNumber, 10)); // 3rd parameter is the no of products to be listed per page
	}, [
		dispatch,
		history,
		userInfo,
		successDelete,
		successCreate,
		createdProduct,
		pageNumber,
	]);

	const handleDelete = (id) => {
		if (window.confirm('Are you sure you wanna delete this product?'))
			dispatch(deleteProduct(id));
	};
	const handleCreateProduct = (product) => {
		dispatch(createProduct());
	};
	return (
		<>
			<Row className='align-items-center'>
				<Col>
					<h1>Products</h1>
				</Col>
				<Col style={{ display: 'flex', justifyContent: 'flex-end' }}>
					<Button
						className='my-3'
						style={{
							padding: '0.5em 1em',
						}}
						onClick={handleCreateProduct}>
						<i className='fas fa-plus'> </i> Create Product
					</Button>
				</Col>
			</Row>
			{errorDelete && (
				<Message variant='danger' duration={10}>
					{errorDelete}
				</Message>
			)}
			{errorCreate && (
				<Message variant='danger' duration={10}>
					{errorCreate}
				</Message>
			)}
			{loading || loadingCreate || loadingDelete ? (
				<Loader />
			) : error ? (
				<Message variant='danger' duration={10}>
					{error}
				</Message>
			) : (
				<>
					<Table
						striped
						bordered
						responsive
						className='table-sm text-center'>
						<thead>
							<tr>
								<th>ID</th>
								<th>NAME</th>
								<th>PRICE</th>
								<th>CATEGORY</th>
								<th>BRAND</th>
								<th>ACTION</th>
							</tr>
						</thead>
						<tbody>
							{products &&
								products.map((product) => {
									return (
										<tr key={product._id}>
											<td>{product._id}</td>
											<td>{product.name}</td>
											<td>${product.price}</td>
											<td>{product.category}</td>
											<td>{product.brand}</td>

											<td
												style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent:
														'space-around',
												}}>
												<LinkContainer
													to={`/admin/product/${product._id}/edit`}>
													<Button
														variant='link'
														className='btn-sm'>
														<i className='fas fa-edit'></i>
													</Button>
												</LinkContainer>
												<Button
													className='btn-sm'
													onClick={() =>
														handleDelete(
															product._id
														)
													}
													variant='danger'>
													<i
														style={{
															fontSize: '0.9em',
															padding: '0',
														}}
														className='fas fa-trash'></i>
												</Button>
											</td>
										</tr>
									);
								})}
						</tbody>
					</Table>
					<Paginate pages={pages} page={page} isAdmin={true} />
				</>
			)}
		</>
	);
};

export default ProductListPage;
